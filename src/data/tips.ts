// ===========================================
// Datos de Tips Financieros
// Consejos pa' que no gastes como loco
// ===========================================

export interface FinancialTip {
    id: number;
    category: 'ahorro' | 'inversion' | 'gastos' | 'habitos' | 'deudas';
    title: string;
    content: string;
    icon: string;
}

export const FINANCIAL_TIPS: FinancialTip[] = [
    // AHORRO
    {
        id: 1,
        category: 'ahorro',
        title: 'La regla del 50/30/20',
        content: 'Destina el 50% de tus ingresos a necesidades, 30% a deseos y 20% al ahorro. Es sencillo y funciona.',
        icon: '📊'
    },
    {
        id: 2,
        category: 'ahorro',
        title: 'Págate a ti primero',
        content: 'Cuando cobres, transfiere automáticamente un porcentaje al ahorro. Lo que no ves, no lo gastas.',
        icon: '💰'
    },
    {
        id: 3,
        category: 'ahorro',
        title: 'El fondo de emergencia',
        content: 'Guarda al menos 3-6 meses de gastos fijos. Es tu colchón pa\' imprevistos.',
        icon: '🛡️'
    },
    {
        id: 4,
        category: 'ahorro',
        title: 'Reto de los 52 semanas',
        content: 'Semana 1: ahorra 1€. Semana 2: 2€. Y así hasta la 52. Al final tendrás 1.378€.',
        icon: '📈'
    },
    {
        id: 5,
        category: 'ahorro',
        title: 'Redondea y ahorra',
        content: 'Cada vez que compres algo, redondea al euro y guarda la diferencia. Las monedas suman.',
        icon: '🪙'
    },

    // INVERSIÓN
    {
        id: 6,
        category: 'inversion',
        title: 'Empieza cuanto antes',
        content: 'El interés compuesto es tu mejor amigo. 100€/mes durante 30 años puede ser más de 100.000€.',
        icon: '⏰'
    },
    {
        id: 7,
        category: 'inversion',
        title: 'Diversifica siempre',
        content: 'No pongas todos los huevos en la misma cesta. Reparte entre acciones, bonos y otros activos.',
        icon: '🥚'
    },
    {
        id: 8,
        category: 'inversion',
        title: 'Los fondos indexados molan',
        content: 'Bajas comisiones y replican el mercado. A largo plazo, suelen superar a los fondos activos.',
        icon: '📉'
    },
    {
        id: 9,
        category: 'inversion',
        title: 'Invierte lo que no necesites',
        content: 'Solo invierte dinero que puedas permitirte no tocar durante al menos 5-10 años.',
        icon: '🎯'
    },

    // GASTOS
    {
        id: 10,
        category: 'gastos',
        title: 'La regla de las 24 horas',
        content: 'Antes de comprar algo caro, espera 24 horas. Muchas veces el impulso desaparece.',
        icon: '⏳'
    },
    {
        id: 11,
        category: 'gastos',
        title: 'Revisa suscripciones',
        content: 'Netflix, Spotify, gym... Suma todo lo que pagas mensualmente. Te sorprenderás.',
        icon: '📱'
    },
    {
        id: 12,
        category: 'gastos',
        title: 'Café en casa',
        content: '3€ al día en café = 90€/mes = 1.080€/año. Piénsalo.',
        icon: '☕'
    },
    {
        id: 13,
        category: 'gastos',
        title: 'Compara precios',
        content: 'Para compras grandes, tómate tu tiempo. Puede haber diferencias de cientos de euros.',
        icon: '🔍'
    },
    {
        id: 14,
        category: 'gastos',
        title: 'Lista de la compra',
        content: 'Ir al super sin lista = comprar mierdas que no necesitas. Simple pero efectivo.',
        icon: '📝'
    },

    // HÁBITOS
    {
        id: 15,
        category: 'habitos',
        title: 'Registra todo',
        content: 'Anota cada gasto, por pequeño que sea. Es la base pa\' entender dónde va tu pasta.',
        icon: '✍️'
    },
    {
        id: 16,
        category: 'habitos',
        title: 'Revisa tus cuentas semanalmente',
        content: 'Dedica 15 minutos a la semana a revisar tus finanzas. Previene sorpresas desagradables.',
        icon: '📅'
    },
    {
        id: 17,
        category: 'habitos',
        title: 'Objetivo concreto',
        content: '"Ahorrar más" no funciona. "Ahorrar 200€/mes para un viaje a Japón" sí funciona.',
        icon: '🎯'
    },
    {
        id: 18,
        category: 'habitos',
        title: 'Automatiza',
        content: 'Programa transferencias automáticas. Lo que es automático, se hace.',
        icon: '🤖'
    },

    // DEUDAS
    {
        id: 19,
        category: 'deudas',
        title: 'Paga la deuda cara primero',
        content: 'Método avalancha: ataca primero la deuda con mayor interés. Ahorras más en intereses.',
        icon: '❄️'
    },
    {
        id: 20,
        category: 'deudas',
        title: 'O empieza por la pequeña',
        content: 'Método bola de nieve: paga primero la más pequeña. Las victorias rápidas motivan.',
        icon: '⚡'
    },
    {
        id: 21,
        category: 'deudas',
        title: 'Evita el mínimo',
        content: 'Pagar solo el mínimo de la tarjeta te deja en un bucle infinito de intereses.',
        icon: '💳'
    },
    {
        id: 22,
        category: 'deudas',
        title: 'Refinancia si puedes',
        content: 'Si tienes un préstamo caro, mira si puedes pasarlo a otro con menor interés.',
        icon: '🔄'
    },

    // NUEVOS TIPS - AHORRO
    {
        id: 23,
        category: 'ahorro',
        title: 'Compra al por mayor',
        content: 'Productos no perecederos (papel, limpieza) suelen ser un 20-30% más baratos en grandes cantidades.',
        icon: '📦'
    },
    {
        id: 24,
        category: 'ahorro',
        title: 'Suscripciones anuales vs mensuales',
        content: 'Si sabes que vas a usar un servicio todo el año, el pago anual suele ahorrarte 2 meses gratis.',
        icon: '📅'
    },
    {
        id: 25,
        category: 'ahorro',
        title: 'Gastos fantasma',
        content: 'Identifica esos micro-pagos que no usas pero sigues pagando. Suelen sumar más de 500€ al año.',
        icon: '👻'
    },

    // NUEVOS TIPS - INVERSIÓN
    {
        id: 26,
        category: 'inversion',
        title: 'Reequilibra tu cartera',
        content: 'Una vez al año, ajusta tus inversiones para que vuelvan a tener el peso original que decidiste.',
        icon: '⚖️'
    },
    {
        id: 27,
        category: 'inversion',
        title: 'Invierte en ti mismo',
        content: 'A veces el mejor retorno viene de un curso o libro que mejore tus habilidades y tu sueldo.',
        icon: '📚'
    },
    {
        id: 28,
        category: 'inversion',
        title: 'Atención a la fiscalidad',
        content: 'No solo importa cuánto ganas, sino cuánto te queda después de impuestos. Usa vehículos eficientes.',
        icon: '🏛️'
    },

    // NUEVOS TIPS - GASTOS
    {
        id: 29,
        category: 'gastos',
        title: 'La regla del coste por uso',
        content: 'Divide el precio de algo por las veces que lo usarás. Unos zapatos de 100€ que usas 200 veces son baratos.',
        icon: '🧮'
    },
    {
        id: 30,
        category: 'gastos',
        title: 'Marcas blancas con sentido',
        content: 'En lo básico (arroz, pasta, limpieza), la marca blanca suele ser igual de buena y mucho más barata.',
        icon: '🏷️'
    },
    {
        id: 31,
        category: 'gastos',
        title: 'Eficiencia energética',
        content: 'Bombillas LED y buen aislamiento pueden bajar tu factura de luz un 15-20% sin esfuerzo.',
        icon: '💡'
    },

    // NUEVOS TIPS - HÁBITOS
    {
        id: 32,
        category: 'habitos',
        title: 'Presupuesto base cero',
        content: 'Asigna cada euro que ganes a una categoría antes de que empiece el mes. Que no sobre nada sin plan.',
        icon: '🏁'
    },
    {
        id: 33,
        category: 'habitos',
        title: 'Visualización de objetivos',
        content: 'Pon una foto de lo que quieres (casa, viaje) en tu fondo de pantalla. Te recordará por qué ahorras.',
        icon: '🖼️'
    },
    {
        id: 34,
        category: 'habitos',
        title: 'Celebra tus hitos',
        content: '¿Llegaste a tus primeros 1.000€ ahorrados? Date un pequeño capricho barato para mantener la motivación.',
        icon: '🎉'
    },

    // NUEVOS TIPS - DEUDAS
    {
        id: 35,
        category: 'deudas',
        title: 'Consolidación consciente',
        content: 'Unificar deudas de tarjetas en un solo préstamo personal suele bajar el interés del 20% al 7-8%.',
        icon: '🔗'
    },
    {
        id: 36,
        category: 'deudas',
        title: 'Crea un fondo de pago',
        content: 'Si vas a amortizar deuda, junta el dinero en una cuenta aparte hasta que tengas una cantidad que impacte.',
        icon: '📈'
    },
    {
        id: 37,
        category: 'deudas',
        title: 'Evita el "Lifestyle Creep"',
        content: 'Si te suben el sueldo, no subas tus gastos de inmediato. Mantén tu nivel de vida y ahorra la diferencia.',
        icon: '🧗'
    }
];

// Obtener tip del día (basado en la fecha)
export const getTipOfTheDay = (): FinancialTip => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % FINANCIAL_TIPS.length;
    return FINANCIAL_TIPS[index];
};

// Obtener tip aleatorio
export const getRandomTip = (): FinancialTip => {
    const index = Math.floor(Math.random() * FINANCIAL_TIPS.length);
    return FINANCIAL_TIPS[index];
};

// Obtener tips por categoría
export const getTipsByCategory = (category: FinancialTip['category']): FinancialTip[] => {
    return FINANCIAL_TIPS.filter(tip => tip.category === category);
};
