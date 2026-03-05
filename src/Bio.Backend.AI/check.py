import torch

print(f"CUDA disponible: {torch.cuda.is_available()}")
print(f"Versión: {torch.version.cuda}")
print(f"Tarjeta: {torch.cuda.get_device_name(0)}")
