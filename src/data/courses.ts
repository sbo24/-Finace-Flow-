// ===========================================
// Datos de Microcursos Financieros
// Cursos cortos adaptados al comportamiento del usuario
// ===========================================

export interface MicroCourse {
    id: string;
    title: string;
    description: string;
    duration: string; // e.g. "3 min"
    icon: string;
    category: 'basics' | 'savings' | 'investing' | 'budgeting' | 'debt';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    lessons: Lesson[];
    triggerConditions?: CourseCondition[]; // Cuándo recomendar este curso
}

export interface Lesson {
    id: string;
    title: string;
    content: string; // Markdown content
    quizzes?: Quiz[];
}

export interface Quiz {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface CourseCondition {
    type: 'high_spending' | 'no_savings' | 'low_budget_adherence' | 'first_investment' | 'new_user';
    category?: string;
    threshold?: number;
}

export interface UserCourseProgress {
    courseId: string;
    completedLessons: string[];
    completed: boolean;
    startedAt: Date;
    completedAt?: Date;
    quizScores: Record<string, boolean[]>; // lessonId -> [quiz1Passed, quiz2Passed, ...]
}

// ==========================================
// CURSOS
// ==========================================

export const MICRO_COURSES: MicroCourse[] = [
    // BÁSICOS
    {
        id: 'basics-budget-101',
        title: 'Tu Primer Presupuesto',
        description: 'Domina tu dinero desde el primer euro',
        duration: '5 min',
        icon: '📊',
        category: 'basics',
        difficulty: 'beginner',
        triggerConditions: [{ type: 'new_user' }],
        lessons: [
            {
                id: 'budget-what',
                title: 'El Poder del Presupuesto',
                content: `# El Poder del Presupuesto

Un presupuesto no es una restricción, es un **mapa hacia tu libertad**. Te permite decidir a dónde va tu dinero en lugar de preguntarte a dónde se fue.

## Los 3 Pilares del Control
1. **Claridad**: Saber exactamente cuánto entra y cuánto sale.
2. **Prioridad**: Decidir qué es importante (ahorro, ocio, facturas).
3. **Paz Mental**: Eliminar la sorpresa de quedarte sin fondos a final de mes.

> "Presupuestar es decirle a tu dinero a dónde ir, en lugar de preguntarte a dónde se fue." — *John Maxwell*
`,
                quizzes: [
                    {
                        question: '¿Cuál es el objetivo principal de un presupuesto?',
                        options: [
                            'Gastar lo menos posible',
                            'Tener un mapa claro de a dónde va tu dinero',
                            'No comprar nada de ocio',
                            'Ser el más rico de tus amigos'
                        ],
                        correctIndex: 1,
                        explanation: 'El presupuesto es una herramienta de planificación para alinear tus gastos con tus objetivos.'
                    },
                    {
                        question: 'Si no haces un presupuesto, ¿qué es lo más probable que ocurra?',
                        options: [
                            'Que ahorres más sin querer',
                            'Que tu dinero desaparezca en gastos hormiga de los que no eres consciente',
                            'Que el banco te regale dinero',
                            'Que los precios bajen'
                        ],
                        correctIndex: 1,
                        explanation: 'Sin control, los pequeños gastos diarios erosionan tu capacidad de ahorro.'
                    }
                ]
            },
            {
                id: 'budget-503020',
                title: 'La Regla de Oro: 50/30/20',
                content: `# El Sistema 50/30/20

Si no quieres complicarte con hojas de cálculo infinitas, usa esta regla:

### 🏠 50% Necesidades
Gastos de los que no puedes prescindir: alquiler, hipoteca, comida básica, electricidad, transporte al trabajo.

### 🎉 30% Deseos (Ocio)
Lo que hace la vida divertida: salir a cenar, Netflix, ese café especial, ropa por capricho.

### 💰 20% Futuro (Ahorro e Inversión)
Tu "yo" del futuro te lo agradecerá: fondo de emergencia, jubilación o pagar deudas.

| Categoría | Meta | Ejemplo (2000€) |
|-----------|------|-----------------|
| Necesidades | 50% | 1000€ |
| Deseos | 30% | 600€ |
| Ahorro | 20% | 400€ |
`,
                quizzes: [
                    {
                        question: 'Si ganas 1.500€ netos, ¿cuánto deberías destinar a "Deseos" según esta regla?',
                        options: ['300€', '450€', '750€', '150€'],
                        correctIndex: 1,
                        explanation: 'El 30% de 1.500€ es 450€.'
                    },
                    {
                        question: '¿En qué categoría entraría el pago de una suscripción de gimnasio que usas por salud?',
                        options: ['Necesidades (un 50/50 según lo veas)', 'Deseos', 'Ahorro', 'Inversión'],
                        correctIndex: 1,
                        explanation: 'Aunque es bueno para la salud, suele considerarse un "deseo" u ocio en un presupuesto estricto, a menos que sea vital para tu trabajo.'
                    }
                ]
            }
        ]
    },

    // AHORRO
    {
        id: 'savings-emergency',
        title: 'Fondo de Emergencia',
        description: 'Tu escudo contra lo inesperado',
        duration: '4 min',
        icon: '🛡️',
        category: 'savings',
        difficulty: 'beginner',
        triggerConditions: [{ type: 'no_savings' }],
        lessons: [
            {
                id: 'emergency-why',
                title: '¿Por qué necesitas un colchón?',
                content: `# Tu Red de Seguridad

La vida lanza curvas: una avería en el coche, una gotera en casa o un despido inesperado. El Fondo de Emergencia transforma una **crisis catastrófica** en un **simple inconveniente**.

## Regla de los 3-6 meses
Debes tener guardados entre 3 y 6 meses de tus **gastos básicos** (no de tu sueldo).

- Si tus gastos son 1000€/mes → Meta: 3000€ - 6000€.

> 💡 **Consejo Pro**: Mantén este dinero en una cuenta separada, líquida (que puedas sacar ya), pero no tan accesible que te den ganas de gastarlo en unas vacaciones.
`,
                quizzes: [
                    {
                        question: '¿Cuál es la cantidad recomendada para un fondo de emergencia?',
                        options: ['1.000€ para empezar', '3-6 meses de gastos básicos', '1 año de sueldo íntegro', 'Lo que sobre de las vacaciones'],
                        correctIndex: 1,
                        explanation: '3-6 meses de gastos cubren la mayoría de imprevistos serios, incluyendo el desempleo temporal.'
                    },
                    {
                        question: '¿Dónde NO debería estar tu fondo de emergencia?',
                        options: [
                            'En una cuenta de ahorros remunerada',
                            'En una cuenta corriente separada',
                            'En una criptomoneda muy volátil',
                            'En un depósito a corto plazo'
                        ],
                        correctIndex: 2,
                        explanation: 'El fondo debe ser estable y estar disponible. Si su valor cae un 40% justo cuando lo necesitas, no servirá de nada.'
                    }
                ]
            },
            {
                id: 'emergency-build',
                title: 'Construcción Paso a Paso',
                content: `# De 0 a 1000€ (y más allá)

No intentes llenarlo en un mes. Usa el sistema del interés en ti mismo:

1. **La Meta 1000**: Primero llega a 1.000€. Esto cubre el 90% de los imprevistos comunes.
2. **Automatiza**: Programa una transferencia el día que cobras la nómina.
3. **Ingresos Extra**: Si recibes un bonus o un regalo, directo al fondo.

## El "Cuestionario del Imprevisto"
Antes de tocar el fondo, pregunta:
- ¿Es inesperado?
- ¿Es necesario?
- ¿Es urgente?

Si la respuesta es "No" a alguna, no es una emergencia.
`,
                quizzes: [
                    {
                        question: '¿Cuál es el primer paso recomendado para construir el fondo?',
                        options: [
                            'Ahorrar 10.000€ de golpe',
                            'Llegar primero a una meta pequeña como 1.000€',
                            'Pedir un préstamo para llenarlo',
                            'Esperar a que suban el sueldo'
                        ],
                        correctIndex: 1,
                        explanation: 'Las metas pequeñas son más fáciles de alcanzar y te motivan a seguir.'
                    }
                ]
            }
        ]
    },

    // GASTO EXCESIVO
    {
        id: 'spending-control',
        title: 'Control de Gastos Hormiga',
        description: 'Detén las pequeñas fugas de capital',
        duration: '4 min',
        icon: '🛑',
        category: 'budgeting',
        difficulty: 'beginner',
        triggerConditions: [{ type: 'high_spending', category: 'restaurants' }, { type: 'high_spending', category: 'shopping' }],
        lessons: [
            {
                id: 'impulse-trap',
                title: 'La Anatomía del Gasto Hormiga',
                content: `# Los Pequeños Fugitivos

Los gastos hormiga son esas compras pequeñas (2€, 5€) que hacemos casi a diario sin pensar. Por separado no parecen nada, pero juntos...

### Ejemplos letales:
- ☕ El café "take-away" (3€ x 20 días = 60€/mes)
- 🍕 El tercer delivery de la semana.
- 📺 Suscripciones que no ves.

## El Efecto Acumulativo
60€/mes invertidos al 7% anual durante 20 años se convierten en casi **31.000€**. *Ese café te está costando un coche.*
`,
                quizzes: [
                    {
                        question: '¿Qué define mejor a un "gasto hormiga"?',
                        options: [
                            'Comprar comida para hormigas',
                            'Pequeños gastos recurrentes que parecen insignificantes',
                            'Pagar la letra del coche',
                            'El alquiler de la casa'
                        ],
                        correctIndex: 1,
                        explanation: 'Su peligro reside en su frecuencia y en que pasan desapercibidos.'
                    },
                    {
                        question: 'Si detectas que gastas 100€ al mes en cosas innecesarias, ¿qué acción es más efectiva?',
                        options: [
                            'Sentirte culpable pero seguir igual',
                            'Eliminar uno o dos y automatizar ese ahorro',
                            'Pedir un aumento',
                            'Borrar la app del banco'
                        ],
                        correctIndex: 1,
                        explanation: 'La clave es la sustitución: deja de gastar en "X" y empieza a ahorrar "X".'
                    }
                ]
            },
            {
                id: 'impulse-control',
                title: 'Técnicas de Defensa Ninja',
                content: `# Tu Escudo Financiero

### 1. La Regla de los 3 Días
¿Ves algo en una tienda (o en Amazon)? Espera 72 horas. Si después de 3 días sigues pensando que lo necesitas, cómpralo. El 80% de las veces verás que el impulso ha pasado.

### 2. Desvincula tu Tarjeta
No guardes los datos de la tarjeta en el navegador o en apps de compras. Tener que levantarte a por la cartera añade "fricción" y te da tiempo a pensar.

### 3. Mes de "Gasto Cero"
Elige un mes y propón no comprar NADA que no sea comida básica o facturas. Es un reset mental increíble.
`,
                quizzes: [
                    {
                        question: '¿Para qué sirve la "fricción" en las compras?',
                        options: [
                            'Para que la tarjeta se desgaste menos',
                            'Para hacernos pensar dos veces antes de pulsar "comprar"',
                            'Para que el envío sea más rápido',
                            'No sirve para nada'
                        ],
                        correctIndex: 1,
                        explanation: 'Cuanto más difícil sea pagar, más probable es que nuestra parte racional tome el control frente al impulso.'
                    }
                ]
            }
        ]
    },

    // PSICOLOGÍA DEL DINERO
    {
        id: 'psychology-money',
        title: 'Psicología del Dinero',
        description: 'Entiende por qué gastas y cómo controlar tu mente',
        duration: '5 min',
        icon: '🧠',
        category: 'basics',
        difficulty: 'intermediate',
        lessons: [
            {
                id: 'biases-1',
                title: 'Sesgos que te Empobrecen',
                content: `# Tu Cerebro te miente

Fuimos diseñados para recolectar bayas, no para gestionar ETFs. Por eso cometemos errores lógicos constantes:

## 1. Aversión a la pérdida
Sentimos el doble de dolor al perder 100€ que alegría al ganar 100€. Esto nos hace entrar en pánico en la bolsa o no vender algo que ya no sirve por el "precio que pagué".

## 2. Sesgo de Anclaje
Si ves un reloj por 500€ y luego lo rebajan a 300€, crees que es un chollo. Pero quizá el valor real sea 100€. Te has "anclado" al primer número.

> 💡 **Lección**: El precio es lo que pagas, el valor es lo que recibes.
`,
                quizzes: [
                    {
                        question: '¿Por qué mantenemos inversiones que pierden dinero durante años?',
                        options: [
                            'Porque somos muy pacientes',
                            'Por la aversión a la pérdida (no queremos reconocer el error)',
                            'Porque siempre vuelven a subir',
                            'Por pereza'
                        ],
                        correctIndex: 1,
                        explanation: 'Nuestro cerebro prefiere una pérdida latente a una real, aunque sea una decisión irracional.'
                    },
                    {
                        question: 'El "Sesgo de Anclaje" se usa en marketing para...',
                        options: [
                            'Que compremos más barato',
                            'Hacernos creer que algo es una oferta basándose en un precio inicial inflado',
                            'Fijar los precios de forma justa',
                            'Ayudar al consumidor'
                        ],
                        correctIndex: 1,
                        explanation: 'Al mostrar un precio alto primero, cualquier precio inferior parece una oportunidad, independientemente de su valor real.'
                    }
                ]
            },
            {
                id: 'emotional-spending',
                title: 'La Dopamina y la Cartera',
                content: `# El Ciclo del Gasto Emocional

Comprar algo nuevo libera dopamina. Es una droga natural. Pero la dopamina dura poco y deja un "gap" que intentamos rellenar con... otra compra.

## Cómo hackear el sistema:
- **Identifica el gatillo**: ¿Compras cuando estás triste? ¿Aburrido? ¿Estresado?
- **Sustitución**: Si estás estresado, sal a correr en lugar de comprar en Amazon. La endorfina es gratis.
- **Visualización**: Piensa en el objeto dentro de 3 meses. ¿Seguirá dándote alegría o estará en un cajón cogiendo polvo?
`,
                quizzes: [
                    {
                        question: '¿Cuál es la mejor forma de combatir el gasto emocional?',
                        options: [
                            'Tener una tarjeta con más límite',
                            'Identificar qué emoción sientes justo antes del impulso',
                            'Comprar cosas más pequeñas',
                            'No salir de casa'
                        ],
                        correctIndex: 1,
                        explanation: 'Conocer tus gatillos emocionales te permite actuar antes de que el impulso sea imparable.'
                    }
                ]
            }
        ]
    },

    // INVERSIÓN
    {
        id: 'investing-start',
        title: 'Inversión: El Interés Compuesto',
        description: 'Haz que tu dinero trabaje mientras duermes',
        duration: '6 min',
        icon: '📈',
        category: 'investing',
        difficulty: 'intermediate',
        triggerConditions: [{ type: 'first_investment' }],
        lessons: [
            {
                id: 'invest-why',
                title: 'La Magia de la Capitalización',
                content: `# La Octava Maravilla

El interés compuesto es cuando los beneficios de tu inversión empiezan a generar sus propios beneficios. Es una bola de nieve.

### Ejemplo Impactante:
Dos amigos, Ana y Luis.
- **Ana**: Invierte 200€/mes desde los 20 hasta los 30 años (10 años en total). Luego deja de meter dinero.
- **Luis**: Empieza a los 30 y mete 200€/mes hasta los 60 años (30 años en total).

A los 60 años, ¡Ana tendrá más dinero que Luis! Empezar 10 años antes vale más que meter dinero durante 30 años después.

> ⏳ **El mejor momento para invertir fue hace 20 años. El segundo mejor momento es hoy.**
`,
                quizzes: [
                    {
                        question: '¿Qué es el interés compuesto?',
                        options: [
                            'Un interés que te cobra el banco por el préstamo',
                            'Reinvertir los beneficios para que generen más beneficios',
                            'El interés que pagan los ricos',
                            'Una fórmula matemática imposible'
                        ],
                        correctIndex: 1,
                        explanation: 'Es el motor de crecimiento de la riqueza a largo plazo: ganar intereses sobre intereses.'
                    },
                    {
                        question: '¿Cuál es el factor más determinante en el interés compuesto?',
                        options: ['La cantidad invertida', 'El tiempo', 'El banco que elijas', 'La suerte'],
                        correctIndex: 1,
                        explanation: 'Aunque la cantidad importa, el tiempo es el exponente en la fórmula. Empezar pronto es la mayor ventaja posible.'
                    }
                ]
            },
            {
                id: 'invest-how',
                title: 'Primeros Pasos Seguros',
                content: `# ¿En qué invierto?

No necesitas ser un lobo de Wall Street. Para el 95% de la gente, lo mejor es la sencillez:

| Opción | Riesgo | Complejidad | Ideal para... |
|--------|--------|-------------|---------------|
| **Fondos Indexados** | Medio | Baja | Invertir en todo el mercado a bajo coste. |
| **Roboadvisors** | Ajustable | Muy Baja | Quien quiere que un algoritmo gestione todo. |
| **Acciones Individuales** | Alto | Alta | Aficionados con tiempo para investigar empresas. |

### Regla de Oro antes de empezar:
- Tienes tu Fondo de Emergencia completo.
- No tienes deudas con intereses altos (>5-6%).
- Entiendes que el mercado bajará a veces y no entrarás en pánico.
`,
                quizzes: [
                    {
                        question: '¿Qué requisito es VITAL antes de invertir en bolsa?',
                        options: [
                            'Tener un fondo de emergencia',
                            'Haber leído 10 libros de finanzas',
                            'Tener una herencia',
                            'Saber predecir el futuro'
                        ],
                        correctIndex: 0,
                        explanation: 'Invertir conlleva riesgo. Si necesitas el dinero mañana para una emergencia, no puedes esperar a que el mercado se recupere.'
                    }
                ]
            }
        ]
    },

    // DEUDAS
    {
        id: 'debt-payoff',
        title: 'Estrategias de Salida de Deuda',
        description: 'Libérate del peso de los intereses',
        duration: '5 min',
        icon: '⛓️',
        category: 'debt',
        difficulty: 'intermediate',
        lessons: [
            {
                id: 'debt-methods',
                title: 'Bola de Nieve vs Avalancha',
                content: `# ¿Cómo atacar la deuda?

Hay dos campos de batalla psicológicos:

## 1. Método Bola de Nieve (Psicología)
Ordena tus deudas de **menor a mayor saldo**. Ataca la más pequeña con todo lo que tengas mientras pagas el mínimo en las demás.
- **Por qué funciona**: Ver una deuda desaparecer rápido te da el subidón necesario para seguir.

## 2. Método Avalancha (Matemáticas)
Ordena tus deudas por **tasa de interés**. Paga primero la más cara (ej: tarjetas de crédito al 20%).
- **Por qué funciona**: Ahorras el máximo dinero posible en intereses.

> 💡 **Consejo**: Si te desmotivas fácil, usa la Bola de Nieve. Si eres un robot matemático, usa la Avalancha.
`,
                quizzes: [
                    {
                        question: 'En el método "Bola de Nieve", ¿cuál es la primera deuda que pagamos?',
                        options: [
                            'La que tiene el interés más alto',
                            'La que tiene el saldo más pequeño',
                            'La que más nos preocupa',
                            'La de los amigos'
                        ],
                        correctIndex: 1,
                        explanation: 'Prioriza las victorias rápidas para mantener la motivación alta.'
                    },
                    {
                        question: '¿Cuál es la principal ventaja del método "Avalancha"?',
                        options: [
                            'Es más divertido',
                            'Ahorras más dinero en intereses a largo plazo',
                            'Terminas antes de pagar todas las deudas pequeñas',
                            'No tiene ventajas'
                        ],
                        correctIndex: 1,
                        explanation: 'Al atacar primero los altos intereses, dejas de regalar tanto dinero al banco.'
                    }
                ]
            }
        ]
    },

    // CRIPTOMONEDAS
    {
        id: 'crypto-basics',
        title: 'Cripto: Entendiendo el Ecosistema',
        description: 'Aprende a diferenciar el valor del ruido',
        duration: '6 min',
        icon: '🔗',
        category: 'investing',
        difficulty: 'advanced',
        lessons: [
            {
                id: 'blockchain-simple',
                title: 'Blockchain: El Libro Inmutable',
                content: `# La Revolución de la Confianza

Blockchain es una base de datos distribuida. Imagina un grupo de Whatsapp donde nadie puede borrar mensajes y todos ven lo que escriben los demás.

### Bitcoin vs Ethereum
- **Bitcoin**: Es "oro digital". Su escasez (solo habrá 21 millones) lo hace una reserva de valor.
- **Ethereum**: Es un ordenador global. Permite crear contratos inteligentes (apps que se ejecutan solas).

> 🔐 **Clave Privada**: Son las llaves de tu caja fuerte. Si las pierdes, el dinero se esfuma para siempre. NADIE puede resetear tu contraseña en la cadena de bloques.
`,
                quizzes: [
                    {
                        question: 'Si pierdes las palabras de recuperación de tu cartera (wallet), ¿qué pasa?',
                        options: [
                            'Llamas a soporte técnico para recuperarlas',
                            'Tu dinero se pierde para siempre',
                            'Vas al banco a reclamar',
                            'Bitcoin se apaga'
                        ],
                        correctIndex: 1,
                        explanation: 'En el mundo cripto tú eres tu propio banco. Sin llaves, no hay acceso. No existe la opción de "olvidé mi contraseña".'
                    },
                    {
                        question: '¿Cuál es la innovación principal de Blockchain?',
                        options: [
                            'Que es muy rápido',
                            'Que permite transferir valor sin necesidad de un intermediario central (banco)',
                            'Que hace que todo sea gratis',
                            'Que consume mucha energía'
                        ],
                        correctIndex: 1,
                        explanation: 'Permite la confianza entre dos partes desconocidas sin un árbitro central.'
                    }
                ]
            },
            {
                id: 'crypto-risks',
                title: 'Gestión de Riesgos Cripto',
                content: `# No apuestes la casa

Las criptomonedas son el activo más volátil que existe. Un -80% es una posibilidad real en cualquier momento.

### Reglas de supervivencia:
1. **Solo dinero que puedas perder**: Nunca metas el dinero del alquiler.
2. **Huye de los "Gurús"**: Si te prometen un 1% diario, es una estafa (Ponzi).
3. **Diversifica**: No metas todo en una sola moneda desconocida (Shitcoin).
`,
                quizzes: [
                    {
                        question: '¿Qué porcentaje de tu patrimonio se recomienda tener en cripto si eres conservador?',
                        options: ['100%', '50%', 'Entre 1% y 5%', 'Mejor no tener nada'],
                        correctIndex: 2,
                        explanation: 'Una exposición pequeña permite capturar el crecimiento exponencial sin arruinarte si el mercado colapsa.'
                    }
                ]
            }
        ]
    },

    // FIRE
    {
        id: 'fire-movement',
        title: 'FIRE: Libertad antes de los 40',
        description: 'Estrategias para retirar el control del tiempo',
        duration: '5 min',
        icon: '🔥',
        category: 'savings',
        difficulty: 'advanced',
        lessons: [
            {
                id: 'fire-math',
                title: 'El Número de tu Libertad',
                content: `# ¿Cuándo puedo dejar de trabajar?

El movimiento FIRE (Financial Independence, Retire Early) se basa en una cifra matemática.

## La Regla del 4%
Según estudios históricos, si retiras el 4% de tu cartera de inversión al año, lo más probable es que tu dinero dure para siempre (o al menos 30+ años).

### El Cálculo:
Multiplica tus **gastos anuales por 25**.
- Gastas 24.000€/año? → Tu cifra FIRE es **600.000€**.

Una vez llegues a ese número invertido, trabajar pasa a ser opcional.
`,
                quizzes: [
                    {
                        question: 'Si mis gastos son de 2.000€ al mes, ¿cuánto necesito para ser libre financieramente?',
                        options: ['24.000€', '250.000€', '600.000€', '1.000.000€'],
                        correctIndex: 2,
                        explanation: '2.000€ x 12 meses = 24.000€. 24.000€ x 25 = 600.000€.'
                    },
                    {
                        question: '¿Qué dice la "Regla del 4%"?',
                        options: [
                            'Que debes ahorrar el 4% de tu sueldo',
                            'Que puedes retirar el 4% anual de tus inversiones de forma segura',
                            'Que los bancos cobran un 4% de comisión',
                            'Que la inflación es siempre del 4%'
                        ],
                        correctIndex: 1,
                        explanation: 'Es el porcentaje de retiro estándar que permite mantener el capital indefinidamente.'
                    }
                ]
            },
            {
                id: 'saving-rate',
                title: 'La Velocidad del Ahorro',
                content: `# El Factor Secreto

Mucha gente cree que para ser libre hay que ganar mucho. Pero lo que importa es tu **tasa de ahorro**.

Si ganas 10.000€ y gastas 10.000€, nunca serás libre.
Si ganas 2.000€ y gastas 1.000€, eres libre en **17 años**.

| Tasa de Ahorro | Años hasta la Independencia |
|----------------|-----------------------------|
| 10% | 51 años |
| 50% | 17 años |
| 75% | 7 años |

> 🏃‍♂️ **La libertad no está en comprar cosas, sino en comprar tu tiempo.**
`,
                quizzes: [
                    {
                        question: '¿Qué acelera más el camino a la libertad financiera?',
                        options: [
                            'Ganar más dinero y gastarlo en un mejor coche',
                            'Aumentar el porcentaje de tus ingresos que ahorras e inviertes',
                            'Esperar a la lotería',
                            'Trabajar más horas extras'
                        ],
                        correctIndex: 1,
                        explanation: 'Tu tasa de ahorro es el motor que determina cuántos años de trabajo te quedan.'
                    }
                ]
            }
        ]
    },

    // IMPUESTOS
    {
        id: 'taxes-beginners',
        title: 'Impuestos: No Pagues de Más',
        description: 'Aprende a jugar con las reglas del sistema',
        duration: '4 min',
        icon: '🧾',
        category: 'basics',
        difficulty: 'beginner',
        lessons: [
            {
                id: 'tax-basics',
                title: 'El IRPF Explicado',
                content: `# ¿Qué le queda al Estado?

El Impuesto sobre la Renta es un impuesto **progresivo**. Esto significa que se paga por tramos.

### El Error Común:
*"Si me suben el sueldo y paso al siguiente tramo, cobraré menos neto"*. **FALSO**. Solo pagas el tipo alto por la parte de dinero que entra en ese nuevo tramo, no por todo tu sueldo.

### Tramos de Inversión (España):
- Primeros 6.000€ de beneficio: 19%
- De 6.000€ a 50.000€: 21%
- > 50.000€: 23%
`,
                quizzes: [
                    {
                        question: 'Si pasas de un tramo del 19% a uno del 23%...',
                        options: [
                            'Pagas el 23% por todo tu sueldo',
                            'Pagas el 23% solo por la cantidad que supera el límite del tramo anterior',
                            'Cobras menos dinero limpio que antes',
                            'El banco te lo devuelve'
                        ],
                        correctIndex: 1,
                        explanation: 'Los impuestos progresivos funcionan por niveles; nunca cobras menos por ganar más.'
                    },
                    {
                        question: '¿Qué es el "Diferimiento Fiscal" en los fondos de inversión?',
                        options: [
                            'No pagar impuestos nunca',
                            'No pagar por las ganancias mientras no vendas el fondo',
                            'Pagar menos impuestos que los demás',
                            'Es una multa'
                        ],
                        correctIndex: 1,
                        explanation: 'Poder mover tu dinero de un fondo a otro sin pasar por Hacienda permite que el interés compuesto trabaje con el 100% de tu capital.'
                    }
                ]
            }
        ]
    },

    // ALQUILER VS COMPRA
    {
        id: 'rent-vs-buy',
        title: 'Vivienda: La Gran Decisión',
        description: 'Analiza tu hogar sin emociones, solo con números',
        duration: '6 min',
        icon: '🏠',
        category: 'basics',
        difficulty: 'intermediate',
        lessons: [
            {
                id: 'rent-buy-math',
                title: 'Los Costes "Invisibles" de Comprar',
                content: `# ¿Es la casa una inversión?

Cuando compras una casa, tienes gastos que nunca recuperas:
1. **Impuestos (ITP/IVA)**: El 8-10% del precio se va a Hacienda.
2. **Intereses Hipotecarios**: En una hipoteca a 30 años, puedes acabar pagando casi el doble de lo que pediste.
3. **Mantenimiento y Seguros**: Una casa "come" dinero todos los meses.

### El Coste de Oportunidad
Si pones 40.000€ de entrada, ese dinero deja de producir intereses en bolsa. Si el mercado da un 7% y la casa se revaloriza un 2%, estás perdiendo un 5% cada año sobre ese capital.
`,
                quizzes: [
                    {
                        question: '¿Qué es el "Coste de Oportunidad" al comprar una casa?',
                        options: [
                            'Lo que te cuesta la mudanza',
                            'El rendimiento que pierdes por no tener ese dinero invertido en otro activo (como bolsa)',
                            'Los impuestos del ayuntamiento',
                            'El precio de la reforma'
                        ],
                        correctIndex: 1,
                        explanation: 'El dinero "atrapado" en los ladrillos no está trabajando en otro lugar.'
                    },
                    {
                        question: 'Alquilar se suele definir como "tirar el dinero". ¿Por qué es un mito?',
                        options: [
                            'Porque el alquiler es gratis',
                            'Porque compras flexibilidad y evitas gastos de mantenimiento e intereses bancarios',
                            'Porque los propietarios son tus amigos',
                            'Porque los pisos siempre bajan'
                        ],
                        correctIndex: 1,
                        explanation: 'Al alquilar pagas por un servicio (techo) sin comprometer capital ni asumir deuda a largo plazo.'
                    }
                ]
            },
            {
                id: 'when-to-buy',
                title: '¿Cuándo merece la pena?',
                content: `# La Regla de los 7 Años

Comprar suele ser mejor que alquilar si:
- Te vas a quedar en el mismo sitio **más de 7-10 años**.
- La cuota de la hipoteca (más IBI, comunidad y ahorro para reparaciones) es significativamente menor que un alquiler.
- Tienes una situación profesional muy estable.

### No compres por presión social
"A tu edad ya deberías tener algo propio". Ignora este consejo. Tu casa es un lugar donde vivir, no necesariamente el mejor vehículo para tu riqueza.
`,
                quizzes: [
                    {
                        question: '¿Cuál es el tiempo mínimo recomendado de residencia para que los gastos de compra compensen frente al alquiler?',
                        options: ['1 año', '3 años', '7-10 años', '50 años'],
                        correctIndex: 2,
                        explanation: 'Los altos costes de entrada (impuestos, notaría) necesitan tiempo para amortizarse.'
                    }
                ]
            }
        ]
    }
];

// ==========================================
// FUNCIONES
// ==========================================

const PROGRESS_KEY = 'financeflow_course_progress';

export const getUserCourseProgress = (userId: string): UserCourseProgress[] => {
    const data = localStorage.getItem(`${PROGRESS_KEY}_${userId}`);
    if (!data) return [];
    return JSON.parse(data);
};

export const saveCourseProgress = (userId: string, progress: UserCourseProgress[]) => {
    localStorage.setItem(`${PROGRESS_KEY}_${userId}`, JSON.stringify(progress));
};

export const startCourse = (userId: string, courseId: string): UserCourseProgress => {
    const progress = getUserCourseProgress(userId);

    const existing = progress.find(p => p.courseId === courseId);
    if (existing) return existing;

    const newProgress: UserCourseProgress = {
        courseId,
        completedLessons: [],
        completed: false,
        startedAt: new Date(),
        quizScores: {}
    };

    progress.push(newProgress);
    saveCourseProgress(userId, progress);

    return newProgress;
};

export const completeLesson = (userId: string, courseId: string, lessonId: string, quizPassed?: boolean[]): void => {
    const progress = getUserCourseProgress(userId);
    const courseProgress = progress.find(p => p.courseId === courseId);

    if (!courseProgress) return;

    if (!courseProgress.completedLessons.includes(lessonId)) {
        courseProgress.completedLessons.push(lessonId);
    }

    if (quizPassed !== undefined) {
        courseProgress.quizScores[lessonId] = quizPassed;
    }

    // Verificar si el curso está completo
    const course = MICRO_COURSES.find(c => c.id === courseId);
    if (course && courseProgress.completedLessons.length === course.lessons.length) {
        courseProgress.completed = true;
        courseProgress.completedAt = new Date();
    }

    saveCourseProgress(userId, progress);
};

export const getRecommendedCourses = (userId: string): MicroCourse[] => {
    const progress = getUserCourseProgress(userId);
    const completedIds = new Set(progress.filter(p => p.completed).map(p => p.courseId));

    // Filtrar cursos no completados
    return MICRO_COURSES.filter(c => !completedIds.has(c.id)).slice(0, 3);
};
