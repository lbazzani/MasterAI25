# api.py
from flask import Flask, request, jsonify
import tensorflow as tf
import pickle
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)

# Carica modello all'avvio
model = tf.keras.models.load_model('intent_model/model.keras')
with open('intent_model/tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)
with open('intent_model/label_encoder.pkl', 'rb') as f:
    label_encoder = pickle.load(f)

@app.route('/classify', methods=['POST'])
def classify():
    data = request.json
    text = data.get('text', '')
    
    sequence = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(sequence, maxlen=20, padding='post')
    prediction = model.predict(padded, verbose=0)
    
    predicted_class = np.argmax(prediction)
    intent = label_encoder.inverse_transform([predicted_class])[0]
    confidence = float(prediction[0][predicted_class])
    
    return jsonify({'intent': intent, 'confidence': confidence})

if __name__ == '__main__':
    app.run(debug=True, port=5000)