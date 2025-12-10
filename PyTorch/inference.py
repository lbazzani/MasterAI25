# inference.py
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

# Carica modello fine-tuned
print("Caricamento modello...")
model = DistilBertForSequenceClassification.from_pretrained("./sentiment-model")
tokenizer = DistilBertTokenizer.from_pretrained("./sentiment-model")
model.eval()  # Modalità valutazione (disabilita dropout)

def predict_sentiment(text):
    # Tokenizza input
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )
    
    # Predizione (no gradients)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        prediction = torch.argmax(logits, dim=-1).item()
    
    # Converti in label
    sentiment = "POSITIVE" if prediction == 1 else "NEGATIVE"
    confidence = torch.softmax(logits, dim=-1)[0][prediction].item()
    
    return sentiment, confidence


# Main loop interattivo
if __name__ == "__main__":
    print("\n=== Sentiment Analyzer ===")
    print("Scrivi una recensione (o 'quit' per uscire)\n")
    
    while True:
        text = input("Recensione: ")
        
        if text.lower() in ['quit', 'exit', 'q']:
            break
        
        if not text.strip():
            continue
        
        sentiment, confidence = predict_sentiment(text)
        print(f"→ {sentiment} (confidence: {confidence:.2%})\n")
    
    print("Arrivederci!")