import { Star, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const reviews = [
  { name: "Emily Carter", role: "Stylist", rating: 5, text: "Absolutely love the quality and unique designs. TrendZone is my go-to for every season!", avatar: hero1 },
  { name: "James Wilson", role: "Photographer", rating: 5, text: "The attention to detail is incredible. Every piece feels premium and looks amazing in photos.", avatar: hero2 },
  { name: "Mia Rodriguez", role: "Designer", rating: 4, text: "Fresh, contemporary designs that stand out. The color palettes are always on point.", avatar: hero3 },
];

const HappyVoices = () => {
  const [idx, setIdx] = useState(0);

  return (
    <section className="py-20 lg:py-28 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-12">
        <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
          Happy Voices
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-primary-foreground transition-colors" aria-label="Previous">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx(Math.min(reviews.length - 1, idx + 1))} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-primary-foreground transition-colors" aria-label="Next">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((review, i) => (
          <div key={review.name} className={`rounded-3xl border border-border p-8 transition-all duration-500 ${i === idx ? "bg-foreground text-primary-foreground border-foreground" : "bg-background"}`}>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className={`w-4 h-4 ${s < review.rating ? (i === idx ? "fill-tz-yellow text-tz-yellow" : "fill-tz-orange text-tz-orange") : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <p className={`font-body text-sm leading-relaxed mb-6 ${i === idx ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              "{review.text}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display font-medium text-sm">{review.name}</p>
                <p className={`font-body text-xs ${i === idx ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HappyVoices;
