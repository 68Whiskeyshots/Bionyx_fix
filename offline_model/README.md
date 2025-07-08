---
base_model: Xenova/movenet-singlepose-thunder
library_name: transformers.js
license: apache-2.0
tags:
- pose-estimation
---

https://huggingface.co/Xenova/movenet-singlepose-thunder with ONNX weights to be compatible with Transformers.js.

Note: Having a separate repo for ONNX weights is intended to be a temporary solution until WebML gains more traction. If you would like to make your models web-ready, we recommend converting to ONNX using [🤗 Optimum](https://huggingface.co/docs/optimum/index) and structuring your repo like this one (with ONNX weights located in a subfolder named `onnx`).