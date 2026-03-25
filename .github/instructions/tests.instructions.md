---
applyTo: "ms-*/src/test/**/*.java,api-gateway/src/test/**/*.java,frontend/src/__tests__/**/*.{js,jsx,ts,tsx}"
---

> **Scope**: Las reglas backend aplican a tests en Java (JUnit 5 + Mockito + Spring Test). Si hay frontend, aplicar su stack de testing correspondiente.

# Instrucciones para Archivos de Pruebas Unitarias

## Principios

- **Independencia**: cada test es 100% independiente — sin estado compartido entre tests.
- **Aislamiento**: mockear SIEMPRE dependencias externas (DB, RabbitMQ, API REST, sistema de archivos).
- **Claridad**: nombre del test debe describir la función bajo prueba y el escenario (qué pasa cuando X).
- **Cobertura**: cubrir happy path, error path y edge cases para cada unidad.

## Backend (JUnit 5 + Mockito)

### Estructura de archivos
```
ms-*/src/test/java/.../
  controller/
  service/
  repository/
```

### Convenciones
- Nombre: `[ClassName]Test` (ej: `EventServiceTest`, `ReservationControllerTest`).
- Unitarios con `@ExtendWith(MockitoExtension.class)`.
- Integración HTTP con `@WebMvcTest` o `@SpringBootTest` según necesidad.
- Mockear dependencias externas (repos, mensajería, APIs de pago simulado).

```java
@ExtendWith(MockitoExtension.class)
class EventServiceTest {
  @Mock
  private EventRepository eventRepository;

  @InjectMocks
  private EventService eventService;

  @Test
  void createEventSuccess() {
    Event saved = new Event();
    saved.setId(1L);
    when(eventRepository.save(any(Event.class))).thenReturn(saved);

    Event result = eventService.create(new Event());
    assertEquals(1L, result.getId());
  }
}
```

## Frontend (Vitest + Testing Library)

### Estructura de archivos
```
frontend/src/__tests__/
  [ComponentName].test.jsx
  use[HookName].test.js
```

### Convenciones
- Nombre del describe: nombre del componente/hook.
- Nombre del it/test: `[verbo] [qué hace] [condición]` (ej: `renders login button when unauthenticated`).
- Usar `vi.mock()` para mockear módulos externos (auth, fetch/axios, APIs).
- Siempre limpiar mocks con `beforeEach(() => vi.clearAllMocks())`.

```jsx
// Ejemplo mínimo de test de componente
describe('LoginPage', () => {
  it('renders email input', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

## Nunca hacer

- Tests que dependen del orden de ejecución.
- Llamadas reales a PostgreSQL, RabbitMQ o APIs externas.
- `console.log` permanentes en tests.
- Lógica condicional dentro de un test (if/else).
- Usar `sleep` para sincronización temporal (cero tests "flaky").

---

> Para quality gates, pirámide de testing, TDD, CDC y nomenclatura Gherkin, ver `.github/docs/lineamientos/dev-guidelines.md` §7 y `.github/docs/lineamientos/qa-guidelines.md`.

### Estructura AAA obligatoria
```text
# GIVEN — preparar datos y contexto
# WHEN  — ejecutar la acción bajo prueba
# THEN  — verificar el resultado esperado
```

### DoR de Automatización
Antes de automatizar un flujo, verificar:
- [ ] Caso ejecutado exitosamente en manual sin bugs críticos
- [ ] Caso de prueba detallado con datos identificados
- [ ] Viabilidad técnica comprobada
- [ ] Ambiente estable disponible
- [ ] Aprobación del equipo

### DoD de Automatización
Un script finaliza cuando:
- [ ] Código revisado por pares (pull request review)
- [ ] Datos desacoplados del código
- [ ] Integrado al pipeline de CI
- [ ] Con documentación y trazabilidad hacia la HU
