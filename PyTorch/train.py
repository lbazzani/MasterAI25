# train.py - File Completo
import torch
import numpy as np
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from transformers import Trainer, TrainingArguments
from datasets import load_dataset

# Carica dataset
print("Caricamento dataset IMDB...")
dataset = load_dataset("imdb")
train_dataset = dataset["train"].shuffle(seed=42).select(range(1000))
test_dataset = dataset["test"].shuffle(seed=42).select(range(200))
print(f"Training: {len(train_dataset)}, Test: {len(test_dataset)}")

# Tokenization
print("Caricamento tokenizer...")
tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=512)

print("Tokenizzazione...")
train_dataset = train_dataset.map(tokenize_function, batched=True)
test_dataset = test_dataset.map(tokenize_function, batched=True)
train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])
test_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

# Modello
print("Caricamento modello...")
model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

# Metrica per accuracy
def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    accuracy = np.mean(predictions == labels)
    return {"accuracy": accuracy}

# Training arguments
training_args = TrainingArguments(
    output_dir="./results", eval_strategy="epoch", learning_rate=2e-5,
    per_device_train_batch_size=8, per_device_eval_batch_size=8,
    num_train_epochs=3, weight_decay=0.01, save_strategy="epoch"
)

# Trainer
trainer = Trainer(model=model, args=training_args, train_dataset=train_dataset, eval_dataset=test_dataset, compute_metrics=compute_metrics)

# Train & Evaluate
print("\n=== TRAINING ===")
trainer.train()
print("\n=== VALUTAZIONE ===")
results = trainer.evaluate()
print(f"Accuracy: {results['eval_accuracy']:.2%}, Loss: {results['eval_loss']:.4f}")

# Save
model.save_pretrained("./sentiment-model")
tokenizer.save_pretrained("./sentiment-model")
print("✓ Modello salvato")