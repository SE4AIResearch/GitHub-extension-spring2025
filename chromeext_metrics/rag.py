import os
from dotenv import load_dotenv
from langchain_openai.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForQuestionAnswering
import torch
import numpy as np
import re
import string
import pandas as pd
from typing import Union
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from aider_call import get_summary_from_aider

import requests
from bs4 import BeautifulSoup
from typing import Union, Optional

load_dotenv()
# app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

loader = TextLoader("data.txt", encoding = "UTF-8")
text_documents = loader.load()
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=20)
documents = text_splitter.split_documents(text_documents)
embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
vectorstore = DocArrayInMemorySearch.from_texts(
    [doc.page_content for doc in documents], embedding=embeddings
)
retriever = vectorstore.as_retriever()

app = FastAPI()

# roberta_tokenizer = AutoTokenizer.from_pretrained("deepset/roberta-base-squad2")
# roberta_model = AutoModelForQuestionAnswering.from_pretrained("deepset/roberta-base-squad2")
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# roberta_model.to(device)

template_w_rag = """
Question: {question}
Context: {context}
Project Context: {project_context}
{commit_url_changes}
"""

template_wo_rag = """Question: {question}"""

def get_token(authorization: Optional[str] = Header(None)):
     if authorization is None:
         raise HTTPException(status_code=401, detail="Missing Authorization header")
     return authorization

def normalize_text(text):
    """Normalize text by lowercasing, removing punctuation, and extra spaces."""
    text = text.lower()
    text = re.sub(f"[{string.punctuation}]", "", text)
    return text.strip()

def get_github_commit_changes(commit_url):
    response = requests.get(commit_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    # print(soup.text)

    changes = []
    files = soup.find_all('div', class_='file')

    div = soup.find('div', class_='Box-sc-g0xbh4-0 prc-PageLayout-PageLayoutContent-jzDMn')
    if div:
         return div.get_text()
    else:
        print('Not Found')
        return ''


def main_wo_rag(query, token):
    parser = StrOutputParser()
    model = ChatOpenAI(api_key=token, model="gpt-4-turbo")
    # setup = RunnableParallel(context=retriever, question=RunnablePassthrough())
    # prompt = ChatPromptTemplate.from_template(template)
    
    chain =  model | parser
    response = chain.invoke(query)

    return response

def main_with_rag(query, retriever, embeddings):
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    parser = StrOutputParser()
    model = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4-turbo")
    setup = RunnableParallel(context=retriever, question=RunnablePassthrough())
    prompt = ChatPromptTemplate.from_template(template_w_rag)
    
    chain = setup | prompt | model | parser


    response = chain.invoke(query)
    return response

@app.middleware("http")
async def log_request(request: Request, call_next):
    # Read request details
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")
    
    # Log method, URL, headers, and body
    print("Request Method:", request.method)
    print("Request URL:", request.url)
    print("Request Headers:", request.headers)
    print("Request Body:", body_str)
    
    # Continue processing the request
    response = await call_next(request)
    return response

class QueryRequest(BaseModel):
    query: Union[str, HttpUrl]
    userag: bool
    git_url: Optional[HttpUrl] = None
    commit_url: Optional[HttpUrl] = None

def is_valid_url(url: str):
    try:
        HttpUrl(url=url)
        return True
    except:
        return False

@app.post("/get-response")
async def process_output(request: QueryRequest, token: str = Depends(get_token)):
    query_text = request.query.strip()
    project_context = ''
    if request.git_url:
        print('Git URL provided: ', request.git_url)
        project_context = get_summary_from_aider(request.git_url)
    
    print('Project Context: ', project_context)
    print('Query Text: ', query_text)
    print('Is Valid URL: ', is_valid_url(query_text))
    #print('token: ', token)
    token = token.split(' ')[1]

    if is_valid_url(query_text):
        #print('Fetching commit changes')
        prompt = '''
            You are an expert software engineer trained in commit summarization.\n
                "Given a code refactorings, go through the entire changes, and extract a meaningful summary using this structure:\n
                \n
                MANDATORY FORMAT:\n
                SUMMARY: A in-depth technical description of the change (2-3 lines max)
                INTENT: Give a software change classification such as Fixed Bug, Internal Quality Improvement, External Quality Improvement, Feature Update, Code Smell Resolution, Refactoring, Performance Optimization, Security Patch, Test Addition, Test Update, Test Removal, Logging Improvement, Dependency Update, Documentation Update, UI/UX Enhancement. Don't be limited to this list. You can also find other classification in the code. Use parent format also Corrective, Perfective, Preventive, and Adaptive
                IMPACT: Explain how the change affects software quality. Use software engineering concepts such as: reduced cyclomatic complexity, improved cohesion
                decreased coupling, better adherence to SRP/OCP, enhanced testability, or improved abstraction layering. Do not use vague terms like 'maintainability' or 'readability' without tying them to specific code behaviors or design principles.\n
                \n
                You MUST include all three sections. Always use the provided INTENT terms. Connect the IMPACT to both the SUMMARY and INTENT using concrete software reasoning.\n\n

                EXAMPLES:\n\n

                Example 1:\n
                SUMMARY: Replaced nested loop in UserProcessor.java with a Map<String, User> lookup. Added early exit logic to validateUserBatch().\n
                INTENT: Adaptive: Performance Optimization, Code Simplification\n
                IMPACT: Reduced time complexity from O(n²) to O(n), improving execution for large inputs. Used guard clauses and data structure optimization to align with efficient control flow and low-complexity design principles.\n\n

                Example 2:\n
                SUMMARY: Extracted credential validation logic into AuthService and introduced LoginRequest/Response DTOs.\n
                INTENT: Perfective: Internal Quality Improvement, Preventive: Architectural Refactoring\n
                IMPACT: Applied SRP by isolating responsibilities and improved cohesion within business logic layers. Reduced controller-service coupling, increasing testability and layering integrity.\n\n

                Example 3:\n
                SUMMARY: Integrated pagination using Spring Data’s Pageable in UserRequestController.\n
                INTENT: Perfective: External Quality Improvement, Adaptive: Feature Update\n
                IMPACT: Improved modularity and frontend responsiveness by reducing payload size. Supports lazy loading and aligns with ISO/IEC 25010 responsiveness and functional suitability metrics.\n\n

                Example 4:\n
                SUMMARY: Replaced switch-case structure in PermissionsManager with polymorphic handlers.\n
                INTENT: Perfective: Code Smell Resolution\n
                IMPACT: Eliminated type-checking smell by encapsulating behavior polymorphically. Reduced conditional logic complexity and applied Strategy pattern as per Refactoring.Guru.\n\n

                Example 5:\n
                SUMMARY: Introduced batch inserts in OrderRepository to replace per-record inserts.\n
                INTENT: Perfective: Performance Optimization\n
                IMPACT: Reduced round trips and improved transactional throughput. Optimized data persistence following performance tuning principles for database operations.\n\n

                Example 6:\n" +
                SUMMARY: Migrated user auth from monolith to OAuth2-based service. Configured token validation with service registry integration.\n
                INTENT: Preventive: Architectural Refactoring\n
                IMPACT: Enabled clean separation of concerns and horizontal scalability by isolating authentication. Aligned architecture with microservices and domain-driven design.\n\n

                Example 7:\n
                SUMMARY: Created PyTest suite to validate reconciliation edge cases, covering duplicate detection and currency rounding.\n
                INTENT: Test Enhancement\n
                IMPACT: Improved edge coverage and defect isolation. Aligned with test-first practices and boosted defect detection rates in CI through targeted regression testing.\n\n

                Example 8:\n
                SUMMARY: Refactored controller to delegate report downloads to ReportService. Removed file streaming logic from controller layer.\n
                INTENT: External Quality Improvement\n
                IMPACT: Reduced coupling and improved abstraction boundaries. Enhanced external quality by aligning responsibilities with modular service-oriented architecture.\n\n
        '''
        changes = get_github_commit_changes(query_text)
        query = prompt + changes + project_context
        response = main_wo_rag(query, token)
        print(response)
        return {"response_with_cs": response}
    else:
        changes = ''
        if request.commit_url:
            changes = 'Commit\'s content: ' + get_github_commit_changes(request.commit_url)
        retrieved_docs = retriever.get_relevant_documents(request.query)
        
        chain_input = {"url": request.query, "context": retrieved_docs, "question": request.query, "project_context": project_context, 'commit_url_changes': changes}
        
        model = ChatOpenAI(api_key=token, model="gpt-4-turbo")
        parser = StrOutputParser()
        if request.userag:
            prompt = ChatPromptTemplate.from_template(template_w_rag)
        else:
            prompt = ChatPromptTemplate.from_template(template_wo_rag)

        # prompt = ChatPromptTemplate.from_template(template_w_rag)
        
        chain = prompt | model | parser
        
        response = chain.invoke(chain_input)
        #print('Generated: ', response)
        return {"response_with_cs": response}