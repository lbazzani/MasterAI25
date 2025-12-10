# test_setup.py
import sys
print(f"Python: {sys.version}\n")

try:
    import tensorflow as tf
    print(f"✓ TensorFlow {tf.__version__}")
    print(f"  GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")
except ImportError:
    print("✗ TensorFlow non installato")

try:
    import numpy as np
    print(f"✓ NumPy {np.__version__}")
except ImportError:
    print("✗ NumPy non installato")

try:
    import sklearn
    print(f"✓ scikit-learn {sklearn.__version__}")
except ImportError:
    print("✗ scikit-learn non installato")

print("\n Tutto OK? Crea data.py e poi esegui train.py")