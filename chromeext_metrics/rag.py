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
import sys
import time
import re
import string
import pandas as pd
from typing import Union
from fastapi import FastAPI, Request
from pydantic import BaseModel, HttpUrl

import requests
from bs4 import BeautifulSoup
from typing import Union

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
"""

template_wo_rag = """Question: {question}"""


def normalize_text(text):
    """Normalize text by lowercasing, removing punctuation, and extra spaces."""
    text = text.lower()
    text = re.sub(f"[{string.punctuation}]", "", text)
    return text.strip()

def get_github_commit_changes(commit_url):
    response = requests.get(commit_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    print(soup.text)

    changes = []
    files = soup.find_all('div', class_='file')

    div = soup.find('div', class_='Box-sc-g0xbh4-0 prc-PageLayout-PageLayoutContent-jzDMn')
    if div:
         return div.get_text()
    else:
        print('Not Found')


def main_wo_rag(query):
    parser = StrOutputParser()
    model = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4-turbo")
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

def is_valid_url(url: str):
    try:
        HttpUrl(url=url)
        return True
    except:
        return False

@app.post("/get-response")
async def process_output(request: QueryRequest):
    query_text = request.query.strip()
    print(query_text)
    print(is_valid_url(query_text))

    if is_valid_url(query_text):
        print('Fetching commit changes')
        prompt = '''
            You are an expert software engineer trained in commit summarization
            Given a code text extracted from Github, go through the entire changes, and extract a meaningful summary using this structure.

            MANDATORY FORMAT:\n
            SUMMARY: A concise technical description of the change (1–2 lines max), 
            INTENT: All the ones which apply: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution, 
            IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability.\n
            \n
            You MUST include all three sections. Always use the specified keywords for INTENT.\n
            Here is example response:
            Example 1:\n
            SUMMARY: Replaced nested loops with a hash-based lookup in UserProcessor.java.\n
            INTENT: Improved Internal Quality, Fixed Bug\n
            IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.\n

        '''
        changes = get_github_commit_changes(query_text)
        query = prompt + changes
        response = main_wo_rag(query)
        return {"response_with_cs": response}
    else:
        retrieved_docs = retriever.get_relevant_documents(request.query)
        
        chain_input = {"url": request.query, "context": retrieved_docs, "question": request.query}
        
        model = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4-turbo")
        parser = StrOutputParser()
        if request.userag:
            prompt = ChatPromptTemplate.from_template(template_w_rag)
        else:
            prompt = ChatPromptTemplate.from_template(template_wo_rag)

        # prompt = ChatPromptTemplate.from_template(template_w_rag)
        
        chain = prompt | model | parser
        
        response = chain.invoke(chain_input)
        print('Generated: ', response)
        return {"response_with_cs": response}

