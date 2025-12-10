# data.py
# Dataset semplificato per training rapido

training_data = [
    # order_status
    ("Where is my order?", "order_status"),
    ("I haven't received my package yet", "order_status"),
    ("Track my shipment", "order_status"),
    ("When will my order arrive?", "order_status"),
    ("Order tracking number", "order_status"),
    ("Delivery status update", "order_status"),
    ("My order is late", "order_status"),
    ("Has my package shipped?", "order_status"),
    
    # return_refund
    ("I want to return this product", "return_refund"),
    ("How do I get a refund?", "return_refund"),
    ("Return policy information", "return_refund"),
    ("Cancel my order and refund", "return_refund"),
    ("I'm not satisfied, want money back", "return_refund"),
    ("Refund request", "return_refund"),
    ("Return shipping label", "return_refund"),

        # product_info
    ("Does this come with warranty?", "product_info"),
    ("What are the product specifications?", "product_info"),
    ("Is this item in stock?", "product_info"),
    ("Product dimensions and weight", "product_info"),
    ("Tell me more about this product", "product_info"),
    ("What colors are available?", "product_info"),
    
    # technical_support
    ("The app is not working", "technical_support"),
    ("I can't login to my account", "technical_support"),
    ("Error message when I try to checkout", "technical_support"),
    ("Website is not loading", "technical_support"),
    ("Payment failed", "technical_support"),
    ("Bug in the mobile app", "technical_support"),

        # shipping_info
    ("How much is shipping?", "shipping_info"),
    ("Do you ship internationally?", "shipping_info"),
    ("Shipping options available", "shipping_info"),
    ("Free shipping threshold", "shipping_info"),
    
    # account_issue
    ("I forgot my password", "account_issue"),
    ("Can't access my account", "account_issue"),
    ("Update my email address", "account_issue"),
    
    # complaint
    ("This product is defective", "complaint"),
    ("Very disappointed with quality", "complaint"),
    ("Poor customer service", "complaint"),
]

def get_training_data():
    texts = [item[0] for item in training_data]
    labels = [item[1] for item in training_data]
    return texts, labels