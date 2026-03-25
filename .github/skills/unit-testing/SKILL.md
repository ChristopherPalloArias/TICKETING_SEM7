---
name: unit-testing
description: Genera tests unitarios e integración para backend y/o frontend. Lee la spec y el código implementado. Requiere spec APPROVED e implementación completa.
argument-hint: "<nombre-feature> [backend|frontend|ambos]"
---

# Unit Testing

## Definition of Done — verificar al completar

- [ ] Cobertura ≥ 80% en lógica de negocio (quality gate bloqueante)
- [ ] Tests aislados — sin conexión a DB real ni RabbitMQ real (siempre mocks)
- [ ] Escenario feliz + errores de negocio + validaciones de entrada cubiertos
- [ ] Los cambios no rompen contratos existentes del módulo

## Prerequisito — Lee en paralelo

```
.github/specs/<feature>.spec.md        (criterios de aceptación)
código implementado en backend/ y/o frontend/
.github/instructions/backend.instructions.md   (JUnit + Mockito + Spring Test)
.github/instructions/frontend.instructions.md  (Vitest + Testing Library)
```

## Output por scope

### Backend → `ms-*/src/test/java/`

| Archivo | Cubre |
|---------|-------|
| `controller/<Feature>ControllerTest.java` | Endpoints: 200/201, 400, 401, 404, 422 |
| `service/<Feature>ServiceTest.java` | Lógica: happy path + errores de negocio |
| `repository/<Feature>RepositoryTest.java` | Queries: parámetros y retornos correctos |

### Frontend → `frontend/src/__tests__/`

| Archivo | Cubre |
|---------|-------|
| `components/<Feature>.test.jsx` | Render + interacciones (click, submit) |
| `hooks/use<Feature>.test.js` | Estado inicial + respuesta API + error handling |
| `pages/<Feature>Page.test.jsx` | Render completo con providers |

## Patrones core

```java
// Backend — AAA con JUnit 5 + Mockito
@ExtendWith(MockitoExtension.class)
class FeatureServiceTest {
    @Mock FeatureRepository repository;
    @InjectMocks FeatureService service;

    @Test
    void createSuccess() {
        Feature saved = new Feature();
        saved.setId(1L);
        when(repository.save(any(Feature.class))).thenReturn(saved);
        Feature result = service.create(new Feature());
        assertEquals(1L, result.getId());
    }
}
```

```js
// Frontend — mock service + renderHook (Vitest + Testing Library)
vi.mock('../../services/featureService');
getFeatures.mockResolvedValue([{ uid: '1' }]);
const { result } = renderHook(() => useFeature());
await waitFor(() => expect(result.current.data).toHaveLength(1));
```

## Restricciones

- Solo `tests/` o `__tests__/`. No modificar código fuente.
- Nunca conectar a DB real ni RabbitMQ real — siempre mocks.
- Cobertura mínima ≥ 80% en lógica de negocio.
