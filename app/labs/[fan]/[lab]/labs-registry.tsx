import dynamic from "next/dynamic";

const RocketOrbitLab = dynamic(() => import("./labs/fizika/RocketOrbitLab"), { ssr: false });
const UniformMotionLab = dynamic(() => import("./labs/fizika/UniformMotionLab"), { ssr: false });
const NewtonLawsLab = dynamic(() => import("./labs/fizika/NewtonLawsLab"), { ssr: false });
const PressureLab = dynamic(() => import("./labs/fizika/PressureLab"), { ssr: false });
const EnergyConservationLab = dynamic(() => import("./labs/fizika/FreeFallLab3D"), { ssr: false });
const ImpulseLab = dynamic(() => import("./labs/fizika/ImpulseLab"), { ssr: false });
const PendulumLab = dynamic(() => import("./labs/fizika/PendulumLab"), { ssr: false });
const SeriesCircuitLab = dynamic(() => import("./labs/fizika/SeriesCircuitLab"), { ssr: false });
const ParallelCircuitLab = dynamic(() => import("./labs/fizika/ParallelCircuitLab"), { ssr: false });
const BuoyancyLab = dynamic(() => import("./labs/fizika/BuoyancyLab"), { ssr: false });
const AtomModelLab = dynamic(() => import("./labs/kimyo/AtomModelLab"), { ssr: false });
const PeriodicTableLab = dynamic(() => import("./labs/kimyo/PeriodicTableLab"), { ssr: false });
const ReactivityLab = dynamic(() => import("./labs/kimyo/ReactivityLab"), { ssr: false });
const TitrationLab = dynamic(() => import("./labs/kimyo/TitrationLab"), { ssr: false });
const GasReactionLab = dynamic(() => import("./labs/kimyo/GasReactionLab"), { ssr: false });
const OrganicSynthesisLab = dynamic(() => import("./labs/kimyo/OrganicSynthesisLab"), { ssr: false });
const CatalystLab = dynamic(() => import("./labs/kimyo/CatalystLab"), { ssr: false });
const ThermochemistryLab = dynamic(() => import("./labs/kimyo/ThermochemistryLab"), { ssr: false });
const ElectrolysisLab = dynamic(() => import("./labs/kimyo/ElectrolysisLab"), { ssr: false });
const BiochemistryLab = dynamic(() => import("./labs/kimyo/BiochemistryLab"), { ssr: false });
const PhotosynthesisLab = dynamic(() => import("./labs/biologiya/PhotosynthesisLab"), { ssr: false });
const CellStructureLab = dynamic(() => import("./labs/biologiya/CellStructureLab"), { ssr: false });
const DnaReplicationLab = dynamic(() => import("./labs/biologiya/DnaReplicationLab"), { ssr: false });
const MicrobiomeLab = dynamic(() => import("./labs/biologiya/MicrobiomeLab"), { ssr: false });
const EcosystemLab = dynamic(() => import("./labs/biologiya/EcosystemLab"), { ssr: false });
const NervousSystemLab = dynamic(() => import("./labs/biologiya/NervousSystemLab"), { ssr: false });
const CirculationLab = dynamic(() => import("./labs/biologiya/CirculationLab"), { ssr: false });
const GeneticsLab = dynamic(() => import("./labs/biologiya/GeneticsLab"), { ssr: false });
const FoodEnergyLab = dynamic(() => import("./labs/biologiya/FoodEnergyLab"), { ssr: false });
const MicroorganismsLab = dynamic(() => import("./labs/biologiya/MicroorganismsLab"), { ssr: false });
const AlgorithmComplexityLab = dynamic(() => import("./labs/informatika/AlgorithmComplexityLab"), { ssr: false });
const DataStructuresLab = dynamic(() => import("./labs/informatika/DataStructuresLab"), { ssr: false });
const RecursionLab = dynamic(() => import("./labs/informatika/RecursionLab"), { ssr: false });
const GraphAlgorithmsLab = dynamic(() => import("./labs/informatika/GraphAlgorithmsLab"), { ssr: false });
const PacketAnalyzerLab = dynamic(() => import("./labs/informatika/PacketAnalyzerLab"), { ssr: false });
const EncryptionLab = dynamic(() => import("./labs/informatika/EncryptionLab"), { ssr: false });
const BruteForceLab = dynamic(() => import("./labs/informatika/BruteForceLab"), { ssr: false });
const AIModelLab = dynamic(() => import("./labs/informatika/AIModelLab"), { ssr: false });
const DatabaseLab = dynamic(() => import("./labs/informatika/DatabaseLab"), { ssr: false });
const CpuRamLab = dynamic(() => import("./labs/informatika/CpuRamLab"), { ssr: false });
const GenericLab = dynamic(() => import("./labs/GenericLab"), { ssr: false });

export function getLabComponent(fan: string, lab: string) {
  const key = `${fan}/${lab}`;

  switch (key) {
    case "fizika/raketa-orbita":
      return RocketOrbitLab;
    case "fizika/tekis-harakat":
      return UniformMotionLab;
    case "fizika/nyuton-qonunlari":
      return NewtonLawsLab;
    case "fizika/bosim":
    case "fizika/ohmqonuni":
      return PressureLab;
    case "fizika/elektrzanjir":
      return SeriesCircuitLab;
    case "fizika/parallel":
      return ParallelCircuitLab;
    case "fizika/elektromagnetizm":
      return BuoyancyLab;
    case "fizika/energiya-saqlanish":
      return EnergyConservationLab;
    case "fizika/impuls":
      return ImpulseLab;
    case "fizika/mayatnik":
      return PendulumLab;
    case "fizika/moment":
      // old name -> redirect to new mayatnik lab
      return PendulumLab;
    case "kimyo/atom-model":
      return AtomModelLab;
    case "kimyo/periodic-jadval":
      return PeriodicTableLab;
    case "kimyo/reaktivlik":
      return ReactivityLab;
    case "kimyo/ph-ojiz":
      return TitrationLab;
    case "kimyo/gaz-loviy":
      return GasReactionLab;
    case "kimyo/organik-sintet":
      return OrganicSynthesisLab;
    case "kimyo/katalizator":
      return CatalystLab;
    case "kimyo/termokimyo":
      return ThermochemistryLab;
    case "kimyo/elektroliz":
      return ElectrolysisLab;
    case "kimyo/biokimyo":
      return BiochemistryLab;
    case "biologiya/fotosintez":
      return PhotosynthesisLab;
    case "biologiya/hujayra-daraja":
      return CellStructureLab;
    case "biologiya/dnk-replikatsiya":
      return DnaReplicationLab;
    case "biologiya/probiotik":
      return MicrobiomeLab;
    case "biologiya/ekologiya-sistem":
      return EcosystemLab;
    case "biologiya/asab-sistema":
      return NervousSystemLab;
    case "biologiya/qon-tizimi":
      return CirculationLab;
    case "biologiya/genetik-analiz":
      return GeneticsLab;
    case "biologiya/oziq-energiya":
      return FoodEnergyLab;
    case "biologiya/mikroorganizmlar":
      return MicroorganismsLab;
    case "informatika/algoritm-tahlil":
      return AlgorithmComplexityLab;
    case "informatika/malumot-struct":
      return DataStructuresLab;
    case "informatika/rekursiya":
      return RecursionLab;
    case "informatika/grafik-algoritmlar":
      return GraphAlgorithmsLab;
    case "informatika/veb-xavfsizlik":
      return PacketAnalyzerLab;
    case "informatika/kriptografiya":
      return EncryptionLab;
    case "informatika/sanoq-analiz":
      return BruteForceLab;
    case "informatika/suniy-intellekt":
      return AIModelLab;
    case "informatika/malumotlar-bazasi":
      return DatabaseLab;
    case "informatika/parallel-hisoblash":
      return CpuRamLab;
    default:
      return GenericLab;
  }
}
