# MailTracer.ai Machine Learning Pipeline

This directory contains the modular machine-learning architecture for training offline phishing, BEC, and domain similarity models (Section 51 & 52).

## Pipeline Architecture

```text
Raw Datasets (Apache SpamAssassin, PhishTank, Enron)
       ↓
Preprocessing & PII Redaction (`preprocessing/clean.py`)
       ↓
Multi-Signal Feature Extraction (`features/extractor.py`)
       ↓
Train/Val/Test Split
       ↓
Model Training (`training/train.py` - XGBoost / Random Forest)
       ↓
Evaluation & Quality Gate (`evaluation/evaluate.py`)
       ↓
Versioned Model Registry (`models/`)
```

## Anti-Poisoning & Offline Learning Policy (Section 53)
MailTracer.ai explicitly does **NOT** auto-retrain production models on arbitrary live user submissions. All updates require verified analyst review, offline curation, deduplication, and formal evaluation before deployment to prevent model poisoning.
