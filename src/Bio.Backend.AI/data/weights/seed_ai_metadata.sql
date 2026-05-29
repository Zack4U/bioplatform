-- BioCommerce Caldas - AI Model & Training Jobs Seed Data
-- Database: PostgreSQL (Scientific Catalog)

-- 1. Insert the initial active model version
INSERT INTO ai_model_versions (
    model_name,
    version,
    accuracy_metric,
    deployed_at,
    is_active,
    notes,
    config_json,
    metrics_json,
    validation_accuracy,
    created_at,
    is_deleted
) VALUES (
    'efficientnet_b2',
    'v1.0.20260518021229',
    0.8835,
    '2026-05-18 02:12:29-05',
    TRUE,
    'Modelo clasificador inicial basado en EfficientNet-B2. Entrenado en 100 épocas sobre 719 especies biológicas de Caldas utilizando Transfer Learning y regularización con Label Smoothing.',
    '{"model_name": "efficientnet_b2", "num_classes": 719, "batch_size": 64, "initial_lr": 0.001, "freeze_epochs": 7, "total_epochs_trained": 100, "best_val_accuracy": 0.8835, "weight_decay": 0.0001, "device": "cuda", "pytorch_version": "2.10.0+cu130"}',
    '{"accuracy": 0.8739, "top_5_accuracy": 0.9514, "eval_loss": 0.4125, "total_images_evaluated": 3595}',
    0.8739,
    '2026-05-18 02:10:00-05',
    FALSE
);

-- 2. Insert mockup background training jobs (AiTrainingJobs)
-- Job 1: Completed training that produced the active model (version linked)
INSERT INTO ai_training_jobs (
    id,
    started_at,
    completed_at,
    status,
    status_message,
    triggered_by_user_id,
    resulting_model_version_id
) VALUES (
    'e51c8901-4475-47bf-8f96-3b6d9c664b51',
    '2026-05-17 19:55:00-05',
    '2026-05-18 02:12:29-05',
    'Completed',
    'Fine-tuning finalizado con éxito en GPU A100. Guardado en S3 y registrado en DVC.',
    '00000000-0000-0000-0000-000000000001', -- Triggered by Admin System User UUID
    (SELECT id FROM ai_model_versions WHERE version = 'v1.0.20260518021229')
);

-- Job 2: Failed training run
INSERT INTO ai_training_jobs (
    id,
    started_at,
    completed_at,
    status,
    status_message,
    triggered_by_user_id,
    resulting_model_version_id
) VALUES (
    'a942cd89-72c6-43b2-bd7c-504fbb1c7a2b',
    '2026-05-18 10:15:00-05',
    '2026-05-18 10:45:12-05',
    'Failed',
    'Error en época 14: CUDA out of memory. Se superó la capacidad de VRAM disponible en GPU.',
    '00000000-0000-0000-0000-000000000001',
    NULL
);

-- Job 3: Interrupted training run
INSERT INTO ai_training_jobs (
    id,
    started_at,
    completed_at,
    status,
    status_message,
    triggered_by_user_id,
    resulting_model_version_id
) VALUES (
    '3bf9d7a2-f81d-409b-ae7f-c1f9c8f2b3e4',
    '2026-05-19 14:00:00-05',
    '2026-05-19 14:15:30-05',
    'Interrupted',
    'Entrenamiento cancelado manualmente por el usuario administrador.',
    '00000000-0000-0000-0000-000000000001',
    NULL
);
