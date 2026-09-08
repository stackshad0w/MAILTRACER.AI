# Machine Learning Training & Evaluation Guide

## Directory Structure
Located in `ml/`:
- `datasets/`: Documentation of permitted open-source research corpora.
- `preprocessing/`: PII removal and text normalization (`clean.py`).
- `features/`: Multi-signal feature extraction (`extractor.py`).
- `training/`: Scikit-learn / XGBoost model training (`train.py`).
- `evaluation/`: Full metric report generation (`evaluate.py`).

## Evaluation Standards (Section 52)
Models must report:
- Accuracy
- Precision & Recall
- F1-Score & ROC-AUC
- False Positive Rate (FPR) & False Negative Rate (FNR)
- Full Confusion Matrix
