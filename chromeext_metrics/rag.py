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
from pydantic import BaseModel

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

# template = """
# You are an expert software engineer trained in commit summarization.
# Visit the provided URL, carefully analyze the commit changes directly from the webpage, and generate a meaningful structured summary strictly following this format:

# MANDATORY FORMAT:
# SUMMARY: A concise technical description of the change (1–2 lines max).
# INTENT: One of: Fixed Bug, Improved Internal Quality, Improved External Quality, Feature Update, Code Smell Resolution.
# IMPACT: Describe how this affects performance, maintainability, readability, modularity, or usability.

# You MUST include all three sections. Always use the specified keywords for INTENT.

# Also clearly mention what information was extracted directly from the provided URL, along with the URL itself.

# Here are some examples before and after your improvements:

# Example 1:
# SUMMARY: Replaced nested loops with a hash-based lookup in UserProcessor.java.
# INTENT: Improved Internal Quality.
# IMPACT: Reduced time complexity from O(n^2) to O(n), improving efficiency and code clarity.

# Example 2:
# SUMMARY: Fixed null pointer exception in PaymentService.java during refund processing.
# INTENT: Fixed Bug.
# IMPACT: Enhanced system stability by preventing crashes and improving error handling.

# Example 3:
# SUMMARY: Refactored the login module to adopt MVC architecture in AuthenticationController.java.
# INTENT: Improved Internal Quality.
# IMPACT: Increased maintainability and readability by separating concerns and simplifying future modifications.

# Example 4:
# SUMMARY: Updated API endpoint to support pagination in user request listings.
# INTENT: Feature Update.
# IMPACT: Improved usability and performance by reducing response times and enhancing navigation.

# Now, generate the structured summary for:
# URL: {url}
# context: {context}
# """

# def typing_effect(text, delay=0.05):
#     for char in text:
#         sys.stdout.write(char)  
#         sys.stdout.flush()     
#         time.sleep(delay) 
#     print()

def normalize_text(text):
    """Normalize text by lowercasing, removing punctuation, and extra spaces."""
    text = text.lower()
    text = re.sub(f"[{string.punctuation}]", "", text)
    return text.strip()


def main_wo_rag(query, retriever, embeddings, ground_truth):
    parser = StrOutputParser()
    model = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-3.5-turbo")
    setup = RunnableParallel(context=retriever, question=RunnablePassthrough())
    prompt = ChatPromptTemplate.from_template(template)
    
    chain =  model | parser
    response = chain.invoke(query)

    return response

def main_with_rag(query, retriever, embeddings):
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    parser = StrOutputParser()
    model = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-3.5-turbo")
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
    query: str
    userag: bool

@app.post("/get-response")
async def process_output(request: QueryRequest):
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

