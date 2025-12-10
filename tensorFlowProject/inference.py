# inference.py
import tensorflow as tf
import pickle
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Carica modello e artifacts
print("Caricamento modello...")
model = tf.keras.models.load_model('intent_model/model.keras')

with open('intent_model/tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)

with open('intent_model/label_encoder.pkl', 'rb') as f:
    label_encoder = pickle.load(f)

max_len = 20  # Deve essere lo stesso di train.py

print("✓ Modello caricato\n")

def predict_intent(text):
    # Preprocessa
    sequence = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(sequence, maxlen=max_len, padding='post')
    
    # Predizione
    prediction = model.predict(padded, verbose=0)
    predicted_class = np.argmax(prediction, axis=1)[0]
    confidence = prediction[0][predicted_class]
    
    intent = label_encoder.inverse_transform([predicted_class])[0]
    return intent, confidence

# Main loop
if __name__ == "__main__":
    print("=== Intent Classifier ===")
    print("Scrivi una richiesta (o 'quit' per uscire)\n")
    
    while True:
        text = input("Query: ")
        if text.lower() in ['quit', 'exit', 'q']:
            break
        if text.strip():
            intent, conf = predict_intent(text)
            print(f"→ {intent} (confidence: {conf:.2%})\n")