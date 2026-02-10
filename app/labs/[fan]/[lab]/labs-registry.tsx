import dynamic from "next/dynamic";

const RocketOrbitLab = dynamic(() => import("./labs/RocketOrbitLab"), { ssr: false });
const UniformMotionLab = dynamic(() => import("./labs/UniformMotionLab"), { ssr: false });

export function getLabComponent(fan: string, lab: string) {
  const key = `${fan}/${lab}`;

  switch (key) {
    case "fizika/raketa-orbita":
      return RocketOrbitLab;
    case "fizika/tekis-harakat":
      return UniformMotionLab;
    default:
      return null;
  }
}
