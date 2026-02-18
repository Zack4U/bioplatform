# Lineamientos Generales para Proyectos de Desarrollo

# **1\. Documentación Obligatoria del Proyecto**

## **1.1 Documento de Visión**

* \[ \] **Resumen ejecutivo** (máx. 2 páginas)  
* \[ \] **Descripción** del problema y oportunidad  
* \[ \] **Stakeholders** identificados  
* \[ \] **Alcance** del producto (In-scope / Out-of-scope)  
* \[ \] **Características** principales del sistema  
* \[ \] **Restricciones** técnicas y de negocio  
* \[ \] **Supuestos** y dependencias  
* \[ \] **Criterios de éxito** medibles

## **1.2 Documento de Arquitectura**

* \[ \] **Diagramas:** Arquitectura general, componentes e interacciones, y despliegue (*deployment*).  
* \[ \] **Patrón arquitectónico:** Definición (Clean Architecture, Hexagonal, etc.).  
* \[ \] **Stack tecnológico:** Listado completo con versiones.  
* \[ \] **Flujo de datos:** Detalle del movimiento entre capas.  
* \[ \] **Seguridad:** Estrategia de autenticación, autorización y encriptación.  
* \[ \] **Integraciones:** Servicios externos y APIs.  
* \[ \] **Operatividad:** Manejo de errores, logging y estrategia de escalabilidad.

## **1.3 Documento de Base de Datos**

* \[ \] **Modelado:** Diagrama ER completo y modelo relacional normalizado (mínimo 3FN).  
* \[ \] **Diccionario de datos:** Tablas, campos, tipos y restricciones.  
* \[ \] **Optimización:** Índices, Stored Procedures, funciones y triggers.  
* \[ \] **Continuidad:** Política de respaldos, recuperación y scripts de migración versionados.  
* \[ \] **Privacidad:** Estrategia de cifrado y anonimización de datos sensibles.

## **1.4 Manuales de Usuario y Sistema**

* \[ \] **Manual de Usuario:** Guía de inicio, funcionalidades con capturas, FAQ y glosario.  
* \[ \] **Manual de Instalación:** Requisitos, paso a paso en Windows Server 2025/Linux, Docker, SSL y Troubleshooting.  
* \[ \] **Manual de Mantenimiento:** Backup/restauración, monitoreo, gestión de roles y rotación de secretos.  
* \[ \] **Manual Técnico de Desarrollo:** Estándares de código, documentación de APIs (Swagger), Guía de testing y CI/CD.

## 

# **2\. Requisitos Técnicos Comunes**

## **2.1 Backend (.NET 8+)**

* \[ \] Implementación de Clean Architecture / Hexagonal.  
* \[ \] Uso de CQRS con MediatR.  
* \[ \] Repository Pattern y Unit of Work.  
* \[ \] Validación con FluentValidation y mapeo con AutoMapper/Mapperly.  
* \[ \] Pruebas unitarias con xUnit (cobertura mín. 60%).

## **2.2 Frontend (Next.js con Vite)**

* \[ \] TypeScript obligatorio.  
* \[ \] Gestión de estado (Zustand/Redux) y Server State (React Query).  
* \[ \] UI con Shadcn/ui o Material-UI.  
* \[ \] Formularios con React Hook Form \+ Zod.  
* \[ \] Accesibilidad WCAG 2.1 Nivel AA y Responsive Design.

## **2.3 IA y Datos**

* \[ \] **Modelo Predictivo:** Entrenado, evaluado y con métricas documentadas.  
* \[ \] **IA Generativa:** Integración con LLMs (OpenAI, Gemini, etc.).  
* \[ \] **RAG:** Implementación con embeddings y base vectorial (ChromaDB, Pinecone).  
* \[ \] **MLOps:** Pipeline de datos y versionado de modelos (MLflow/DVC).

## **2.4 Seguridad y DevOps**

* \[ \] **Auth:** JWT con Refresh Tokens, RBAC y 2FA (TOTP).  
* \[ \] **Protección:** Rate limiting, sanitización de inputs y protección XSS/SQLi.  
* \[ \] **Docker:** Dockerfile optimizado (multi-stage) y Docker Compose.  
* \[ \] **CI/CD:** Pipeline funcional en GitHub Actions o GitLab CI.

# 

# **3\. Cronograma de Entregables (Metodología Scrum)**

*8 Sprints de 2 semanas cada uno (Total: 16 semanas).*

| Fase | Hito / Entregable Principal | Estado |
| :---- | :---- | :---- |
| **Semana 2** | Visión, Arquitectura inicial, Modelo ER y Product Backlog. | \[ \] |
| **Semana 4** | Estructura Backend, Seeders BD y Wireframes Frontend. | \[ \] |
| **Semana 6** | Auth funcional, Componentes base y Dataset de IA preprocesado. | \[ \] |
| **Semana 8** | CRUDs principales e Integración Backend-Frontend operativa. | \[ \] |
| **Semana 10** | Lógica de negocio compleja y RAG/Chatbot funcional. | \[ \] |
| **Semana 12** | API documentada, Interfaz responsive y IA optimizada. | \[ \] |
| **Semana 14** | Contenedores Docker, Testing (\>60%) y Seguridad completa. | \[ \] |
| **Semana 16** | Entrega final: Manuales, Video Demo y Sistema desplegado. | \[ \] |

# **4\. Criterios de Evaluación (Rúbrica)**

* **Funcionalidad (25%):** Casos de uso cumplidos e integración total.  
* **IA (20%):** Accuracy \> 80% y RAG funcional.  
* **Arquitectura (20%):** Código limpio y cobertura de pruebas.  
* **Seguridad (15%):** 2FA, RBAC y gestión de secretos.  
* **Despliegue (10%):** Docker y TRL 6-7.  
* **Documentación (10%):** Manuales claros y diagramas precisos.

