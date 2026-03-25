---
description: 'Ejecuta el QA Agent con skills de Gherkin, riesgos y performance para generar el plan de calidad basado en la spec aprobada.'
agent: QA Agent
---

Ejecuta el QA Agent con los skills de QA disponibles para el repositorio.

**Feature**: ${input:featureName:nombre del feature en kebab-case}

**Instrucciones para @QA Agent:**

1. Lee `.github/docs/lineamientos/qa-guidelines.md` como primer paso
2. Lee la spec en `.github/specs/${input:featureName}.spec.md`
3. Ejecuta skills en este orden:
   - `/gherkin-case-generator`   → casos Given-When-Then y datos de prueba
   - `/risk-identifier`          → matriz de riesgos ASD
   - `/performance-analyzer`     → solo si hay SLAs en la spec
   - `/automation-flow-proposer` → solo si el usuario lo solicita
4. Genera reporte consolidado al finalizar

**Prerequisito:** Debe existir `.github/specs/${input:featureName}.spec.md` con estado APPROVED. Si no, ejecutar `/generate-spec` primero.
