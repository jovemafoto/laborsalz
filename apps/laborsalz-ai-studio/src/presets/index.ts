import type { Surface } from "@/generation/catalog";

export type StudioPreset = {
  id: string;
  group: "LaborSalz" | "Nuance";
  name: string;
  surface: Surface;
  description: string;
  prompt: string;
};

export const STUDIO_PRESETS: readonly StudioPreset[] = [
  {
    id: "laborsalz-character-lock",
    group: "LaborSalz",
    name: "Character Lock",
    surface: "image",
    description: "Preserva identidade, proporção e características da referência.",
    prompt:
      "Use the supplied reference as the identity anchor. Preserve facial identity, anatomy, proportions, wardrobe logic and distinctive features exactly. Keep realistic skin and material texture, coherent perspective, physically plausible light and natural detail. Do not stylize or redesign the subject unless explicitly requested.",
  },
  {
    id: "laborsalz-baki-realism",
    group: "LaborSalz",
    name: "Baki Realism",
    surface: "image",
    description: "Realismo fotográfico consistente para o cão de referência.",
    prompt:
      "Recreate the dog from the supplied reference with strict identity consistency: correct breed traits, body scale, muzzle, ears, coat pattern and natural fur texture. Match scene perspective, depth of field and lighting. The dog must feel physically present in the photograph, never pasted in, oversized, cartoonish or over-smoothed.",
  },
  {
    id: "laborsalz-cover-remix",
    group: "LaborSalz",
    name: "Cover Remix",
    surface: "image",
    description: "Releitura cinematográfica preservando a lógica visual original.",
    prompt:
      "Create a cinematic reinterpretation of the supplied cover reference. Preserve the original composition logic, subject relationships, texture density and photographic credibility while rebuilding the scene as a fresh image. Keep practical lighting, believable lens behavior, subtle grain, natural surfaces and coherent scale.",
  },
  {
    id: "laborsalz-cinematic-rain",
    group: "LaborSalz",
    name: "Cinematic Rain",
    surface: "image",
    description: "Noite, chuva e luz prática com textura fotográfica realista.",
    prompt:
      "Cinematic night photography in light rain. Wet surfaces with controlled reflections, practical street lighting, realistic atmospheric haze, natural skin and material texture, restrained contrast, believable 35mm lens behavior, subtle motion and filmic grain. Avoid glossy CGI surfaces and artificial over-sharpening.",
  },
  {
    id: "laborsalz-cinematic-motion",
    group: "LaborSalz",
    name: "Cinematic Motion",
    surface: "video",
    description: "Movimento de câmera natural para cenas cinematográficas.",
    prompt:
      "Cinematic live-action shot with physically believable camera movement, natural acceleration and deceleration, stable subject identity, coherent anatomy and lighting across frames. Preserve texture and fine detail. Motion should feel operated by a real camera team, not synthetic or elastic.",
  },
  {
    id: "nuance-packshot-clean",
    group: "Nuance",
    name: "Packshot Clean",
    surface: "image",
    description: "Packshot limpo, fiel ao produto e sem alterar construção.",
    prompt:
      "Create a premium studio packshot using the supplied product as the exact construction reference. Preserve seams, lace, straps, trims, proportions, color and every garment detail. Neutral #F2F2F2 background, soft diffused studio light, subtle contact shadow, 50mm product-photography perspective, crisp textile texture and realistic material response. Do not redesign, add or remove product details.",
  },
  {
    id: "nuance-editorial",
    group: "Nuance",
    name: "Campaign Editorial",
    surface: "image",
    description: "Editorial de moda realista com prioridade para tecido e produto.",
    prompt:
      "Premium fashion editorial with natural skin texture, realistic textile behavior and faithful garment construction. Elegant direction, controlled studio or location lighting, refined composition and believable lens depth. The product must remain the visual priority. Never alter lace, seams, straps, trims, silhouette or color from the supplied reference.",
  },
  {
    id: "nuance-editorial-motion",
    group: "Nuance",
    name: "Editorial Motion",
    surface: "video",
    description: "Movimento editorial preservando roupa, corpo e continuidade.",
    prompt:
      "Fashion editorial motion with graceful natural movement, stable anatomy and strict garment continuity. Preserve product construction, color and textile texture throughout the shot. Use controlled camera movement, realistic fabric physics and polished but believable lighting.",
  },
];
