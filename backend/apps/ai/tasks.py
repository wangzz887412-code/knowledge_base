import os
import chromadb
from django.conf import settings
from django.apps import apps
from celery import shared_task
from .parsers import parse_file


@shared_task
def process_file(file_id):
    File = apps.get_model('files', 'File')
    try:
        file_obj = File.objects.get(id=file_id)
        file_obj.status = 'processing'
        file_obj.save()
        
        text = parse_file(file_obj.file.path)
        file_obj.extracted_text = text
        file_obj.save()
        
        mindmap_data = generate_mindmap(file_id, text)
        file_obj.mindmap_data = mindmap_data
        file_obj.save()
        
        store_in_chroma(file_id, text)
        
        file_obj.status = 'ready'
        file_obj.save()
    except Exception as e:
        file_obj = File.objects.get(id=file_id)
        file_obj.status = 'error'
        file_obj.save()
        raise


@shared_task
def generate_mindmap(file_id, text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    nodes = []
    for i, line in enumerate(lines[:20]):
        nodes.append({
            'id': f'node_{i}',
            'text': line[:50],
            'children': []
        })
    return {
        'root': {
            'id': 'root',
            'text': f'思维导图_{file_id}',
            'children': nodes
        }
    }


@shared_task
def store_in_chroma(file_id, text):
    client = chromadb.PersistentClient(path=str(settings.CHROMA_PERSIST_DIR))
    collection = client.get_or_create_collection(name='documents')
    
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            metadatas=[{'file_id': str(file_id), 'chunk_index': i}],
            ids=[f'{file_id}_{i}']
        )
