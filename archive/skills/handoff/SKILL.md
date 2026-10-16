---
name: handoff
description: "Escribe el handoff de un ciclo de trabajo en el vault, verificando el estado contra git antes de afirmarlo. Usar al cerrar una sesion larga, antes de compactar, cuando el usuario dice handoff, /handoff, escribi el handoff, donde quedamos, antes de irme, cerra el ciclo, o cuando un hilo se vuelve demasiado largo para retomarlo de memoria. No usar para resumir una conversacion corta ni para escribir un prompt de arranque de otra sesion."
compatibility: "Requiere un repo git y acceso de lectura al vault. gh y npm son opcionales; sin ellos las secciones de PRs y version publicada se omiten."
---

# Handoff

El handoff existe para que la proxima sesion retome sin releer el transcript. Su valor no es el resumen: es **la distancia entre lo que el hilo cree y lo que el disco dice**. Un handoff que transcribe la conversacion propaga los errores de la conversacion.

Escribi en espanol, con tildes y enes. Sin emojis. Sin em dashes.

## 1. Verifica antes de escribir

Corre esto **antes** de redactar una sola linea. Es lectura pura, no toca nada.

```bash
git -C <repo> status --short
git -C <repo> log --oneline -15
git -C <repo> status -sb | head -1          # ahead/behind
gh pr list --state all --limit 10            # si hay remote GitHub
npm view <pkg> version                       # si publica a npm
```

Contrasta cada afirmacion del hilo contra esa salida. Los desacuerdos son el material mas valioso del handoff: "el hilo dijo X, el disco dice Y".

Clasifica cada afirmacion material antes de redactarla:

| Clase | Que es |
|---|---|
| Recuperable | Alguien puede volver a correr el comando y ver lo mismo: SHA, numero de PR, version en npm, salida citada |
| Reportado | Se afirmo en el hilo pero nadie lo observo correr |
| Inferido | Se deduce de otra cosa. Que el codigo se vea bien no es que funcione |
| Desconocido | No se pudo confirmar por esta via |

Lo reportado y lo inferido no se ascienden a hecho por repetirlos. Lo desconocido no se omite: se nombra.

No corras tests ni builds. Este paso no genera evidencia nueva, solo separa la que hay de la que se supone.

**Completo cuando:** cada afirmacion de estado tiene su clase, y las recuperables tienen su comando de respaldo.

## 2. Ubica el archivo y decide apilar

El handoff vive en el vault, no en el repo de codigo:

- Proyecto en `04_Projects/_active/<x>/` o `_shaping/<x>/` -> `HANDOFF.md` ahi.
- Trabajo de Vercel -> `05_Areas/vercel/<proyecto>-handoff.md`.
- Otro -> junto a los docs del proyecto en el area que le corresponde.

Si existe un work-item manifest, usalo como fuente primaria de estado y verifica solo los campos que pueden derivar. El handoff mantiene un `## Estado activo` compacto al inicio y un `## Historial` append-only al final. Actualiza el estado activo en cada cierre; agrega una entrada fechada al historial sin reescribir entradas anteriores.

**Completo cuando:** el path esta resuelto, el snapshot activo refleja el manifest actual y sabes si agregas una entrada al historial.

## 3. Escribi las tres secciones obligatorias

Nada mas es obligatorio. Estas tres van siempre, con el nombre que le calce al ciclo.

**Estado activo.** Resume lo mergeado, publicado o funcionando *ahora*, el manifest, el stage actual, exact HEAD, autorizacion, bloqueante, siguiente comando y evidencia. Si el hilo creia que algo estaba hecho y el disco dice que no, aca se dice.

Para cada pieza, tres hechos **separados**. Cada uno avanza solo con evidencia propia, y ninguno arrastra a los otros:

- **Entrega**: local, commiteado, pusheado, mergeado, publicado.
- **Verificacion**: si alguien lo observo correr y produjo lo esperado.
- **Juicio humano**: si vos lo miraste, escuchaste o aprobaste.

Mergeado con tests verdes puede ser entrega mergeada, verificacion parcial y juicio humano pendiente. Escribir "listo" colapsa los tres y es el fallo que mas cuesta: los cuatro bugs de vcut vivian en la frontera con ffmpeg, que es justo lo que los tests mockean.

**Donde retomar.** En orden de valor, no de comodidad. Si un pendiente invalida a los demas cuando sale mal, va primero y se dice explicitamente que es el bloqueante. Un pendiente sin el comando o el path para arrancarlo no sirve.

**Decisiones que son del dueno.** Dos clases, y conviene separarlas:
- Lo que espera juicio humano y frena el avance.
- Lo ya decidido que no hay que re-litigar, con su razon.

Las decisiones descartadas necesitan la razon anotada justamente para poder reabrirlas cuando la razon muere.

**Completo cuando:** el estado activo, donde retomar y decisiones del dueno existen y ninguna esta rellenada con generalidades.

## 4. Agrega solo las condicionales que tengan contenido real

Cada una entra **unicamente si hay algo concreto que decir**. Una seccion vacia o rellenada con obviedades es el impuesto que hace que nadie corra la skill dos veces.

| Seccion | Entra cuando |
|---|---|
| Necesita verificacion humana | Algo quedo afirmado sin poder probarse: hace falta escuchar, mirar, o correrlo en el entorno real |
| Bugs con lo que los delato | Se encontro un defecto y se sabe que instrumento lo expuso |
| Lecciones de metodo | Un error costo tiempo y su forma se puede reconocer la proxima vez |
| Bloqueado por afuera | Depende de un tercero, un permiso, o una respuesta |
| Fuera de alcance | Se decidio deliberadamente no hacer algo, y sin decirlo alguien lo va a proponer de nuevo |
| Punteros | Hay otros documentos que el proximo tiene que leer, con su path, incluido el caso en `railly/skills` si un item ya cerro |
| Entorno que costo | Setup, credenciales o gotchas que se van a volver a pagar |

**Completo cuando:** cada seccion presente tiene contenido especifico, y las que no lo tenian no se escribieron.

## 5. Revisa contra estos cuatro fallos

Antes de guardar:

1. **Numeros sin procedencia.** Todo numero lleva como se obtuvo. "119 silencios detectados, medido antes de escribir el parser" sirve; "muchos silencios" no. Nunca inventes una cifra que no mediste.
2. **"Listo" sin evidencia observada.** Commiteado no es verificado. Que el codigo se vea bien no es verificacion. Si nadie lo miro correr, se dice.
3. **Cronologia.** "Primero hicimos X, despues Y" es lo que ya cuenta el git log. El handoff reporta estado, no narrativa.
4. **Pendiente documentado en vez de cerrado.** Si algo se puede arreglar en dos minutos ahora, arreglalo en vez de escribirlo. Escribir la friccion no puede volverse el sustituto de resolverla.

**Completo cuando:** ninguno de los cuatro sobrevive en el texto.

## Que no es esto

- **No es un prompt de arranque.** Un documento que le dice a otro agente que hacer, en segunda persona y con criterios de exito, es otro genero. Este reporta estado pasado.
- **No es un handoff holistico.** Cuando el hallazgo *es* la historia (un linaje de proyectos, un diagnostico que precede al codigo), eso se escribe a mano. Pasa dos o tres veces al ano.
- **No es un resumen de la conversacion.** Si no corriste los comandos del paso 1, no escribiste un handoff.
- **No es un caso.** El handoff cubre un ciclo abierto y se consume al retomarlo. Cuando un item cierra y deja una leccion transferible, eso es trabajo de `record-a-case`: vive en `cases/<repo>/`, pasa por su puerta de confidencialidad y se promociona a regla o eval. El handoff lo **cita por path**, no lo duplica. Los handoffs de portless, wterm y agent-browser ya hacen exactamente eso.
