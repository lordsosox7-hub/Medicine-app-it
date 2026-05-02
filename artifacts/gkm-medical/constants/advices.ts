import type { Feather } from "@expo/vector-icons";

export type Advice = {
  title: string;
  body: string;
  icon: keyof typeof Feather.glyphMap;
};

export const ADVICES: Advice[] = [
  {
    title: "نصيحة صحية ذكية",
    body: "اشرب الماء بانتظام للحفاظ على ضغط الدم ودعم وظائف الجسم الحيوية.",
    icon: "droplet",
  },
  {
    title: "حركة بسيطة، فائدة كبيرة",
    body: "امشِ 30 دقيقة يومياً لتحسين صحة القلب وتنشيط الدورة الدموية.",
    icon: "activity",
  },
  {
    title: "نوم هادئ",
    body: "احرص على النوم 7 إلى 8 ساعات يومياً لتعزيز المناعة وصفاء الذهن.",
    icon: "moon",
  },
  {
    title: "غذاء متوازن",
    body: "أكثر من الخضروات والفواكه الطازجة في وجباتك للحصول على الفيتامينات اللازمة.",
    icon: "shopping-bag",
  },
  {
    title: "قلل من السكر",
    body: "الإفراط في السكر يرفع الوزن وضغط الدم؛ اختر بدائل طبيعية كالفواكه.",
    icon: "minus-circle",
  },
  {
    title: "نَفَس عميق",
    body: "خصص دقائق يومياً للتنفس العميق لتقليل التوتر وضبط ضربات القلب.",
    icon: "wind",
  },
  {
    title: "اغسل يديك",
    body: "غسل اليدين بالماء والصابون لمدة 20 ثانية يحميك من معظم العدوى.",
    icon: "thumbs-up",
  },
  {
    title: "افحص ضغطك",
    body: "قِس ضغط الدم بشكل دوري حتى لو شعرت بصحة جيدة لاكتشاف أي تغير مبكراً.",
    icon: "heart",
  },
  {
    title: "احمِ بشرتك",
    body: "استخدم واقي الشمس قبل الخروج لحماية بشرتك من الأشعة الضارة.",
    icon: "sun",
  },
  {
    title: "قلل الملح",
    body: "الإكثار من الملح يرفع ضغط الدم؛ تذوّق طعامك قبل إضافة المزيد.",
    icon: "alert-circle",
  },
  {
    title: "أوميغا 3 لقلبك",
    body: "تناول الأسماك الدهنية كالسلمون مرتين أسبوعياً لدعم صحة القلب.",
    icon: "anchor",
  },
  {
    title: "ابتعد عن التدخين",
    body: "الإقلاع عن التدخين يبدأ بتحسين دورتك الدموية خلال أيام قليلة فقط.",
    icon: "x-octagon",
  },
  {
    title: "حافظ على وزنك",
    body: "وزن صحي يقلل خطر السكري وأمراض القلب؛ تابعه أسبوعياً.",
    icon: "trending-down",
  },
  {
    title: "افحص سكر الدم",
    body: "إذا كان لديك تاريخ عائلي للسكري، افحص سكر الدم سنوياً على الأقل.",
    icon: "thermometer",
  },
  {
    title: "اعتنِ بأسنانك",
    body: "نظف أسنانك مرتين يومياً واحجز موعداً مع طبيب الأسنان كل 6 أشهر.",
    icon: "smile",
  },
  {
    title: "تمدد عضلاتك",
    body: "تمارين الإطالة تخفف آلام الظهر والرقبة الناتجة عن الجلوس الطويل.",
    icon: "maximize-2",
  },
  {
    title: "قلل الكافيين مساءً",
    body: "تجنب القهوة بعد الساعة الرابعة عصراً لتنام نوماً عميقاً ومريحاً.",
    icon: "coffee",
  },
  {
    title: "افحص نظرك",
    body: "زر طبيب العيون مرة سنوياً، خاصة إذا كنت تستخدم الشاشات لفترات طويلة.",
    icon: "eye",
  },
  {
    title: "تواصل مع أحبابك",
    body: "العلاقات الاجتماعية الإيجابية تقلل التوتر وتدعم صحتك النفسية.",
    icon: "users",
  },
  {
    title: "قسّم وجباتك",
    body: "تناول 5 وجبات صغيرة يومياً يحافظ على طاقتك ويمنع الإفراط في الأكل.",
    icon: "pie-chart",
  },
  {
    title: "تجنّب الأطعمة المصنعة",
    body: "اختر الطعام الطازج بدل الجاهز لتقليل الدهون المتحولة والأملاح.",
    icon: "package",
  },
  {
    title: "تحرّك كل ساعة",
    body: "إذا كنت تجلس طويلاً، قم وامشِ دقيقتين كل ساعة لتنشيط الدورة الدموية.",
    icon: "refresh-cw",
  },
  {
    title: "اشرب الشاي الأخضر",
    body: "كوب من الشاي الأخضر يومياً غني بمضادات الأكسدة المفيدة للقلب.",
    icon: "feather",
  },
  {
    title: "افحص الكوليسترول",
    body: "افحص الكوليسترول كل سنتين على الأقل بعد سن الثلاثين لحماية قلبك.",
    icon: "bar-chart-2",
  },
  {
    title: "مارس هواية تحبها",
    body: "وقت ممتع مع هوايتك المفضلة يقلل التوتر ويحسّن الحالة المزاجية.",
    icon: "music",
  },
  {
    title: "احذر الجفاف",
    body: "اشرب 8 أكواب ماء يومياً، وأكثر منها في الأيام الحارة أو عند ممارسة الرياضة.",
    icon: "cloud-drizzle",
  },
  {
    title: "تأمل لـ 5 دقائق",
    body: "التأمل اليومي يحسن التركيز ويخفض هرمونات التوتر بشكل ملحوظ.",
    icon: "compass",
  },
  {
    title: "افحص فيتامين د",
    body: "نقص فيتامين د شائع؛ افحصه دورياً ويُعوّض بالتعرض للشمس أو المكملات.",
    icon: "sunrise",
  },
  {
    title: "قلل الشاشات قبل النوم",
    body: "ابتعد عن الهاتف ساعة قبل النوم لتحسين جودة النوم وراحة عينيك.",
    icon: "smartphone",
  },
  {
    title: "زر طبيبك سنوياً",
    body: "الفحص الشامل السنوي يكشف الأمراض مبكراً ويمنحك خطة وقائية مناسبة.",
    icon: "user-check",
  },
];

/**
 * Returns the index of the advice for the given date.
 * Uses a simple UTC day-of-year calculation that works on all JS engines
 * (Hermes included), falling back to date.getDate() if anything goes wrong.
 */
export function getAdviceIndexForDate(date: Date = new Date()): number {
  try {
    const y = date.getUTCFullYear();
    const start = Date.UTC(y, 0, 1);
    const dayOfYear = Math.floor((date.getTime() - start) / (1000 * 60 * 60 * 24));
    const idx = ((dayOfYear) % ADVICES.length + ADVICES.length) % ADVICES.length;
    if (Number.isFinite(idx)) return idx;
  } catch {}
  return date.getDate() % ADVICES.length;
}

export function getTodayAdvice(date: Date = new Date()): Advice {
  return ADVICES[getAdviceIndexForDate(date)] ?? ADVICES[0];
}
