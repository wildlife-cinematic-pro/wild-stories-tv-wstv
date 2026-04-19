import type { Arc, Weather } from "@/types";

const ARC_SAFE_LABEL: Record<string, string> = {
  "Chase and takedown": "chase sequence",
  "Ambush attack": "ambush sequence",
  "Escape from danger": "escape sequence",
  "Territory dominance battle": "dominance encounter",
  "Predator vs predator fight": "predator confrontation",
  "Pack hunting strategy": "Pack hunting strategy",
  "Defender stands ground": "defensive stand",
  "Giant vs giant clash": "giant confrontation",
};

export function getSafeArcLabel(arc: string): string {
  return ARC_SAFE_LABEL[arc] || "wildlife encounter";
}

export function getSafeArcPrint(arc: string): string {
  return getSafeArcLabel(arc);
}

export type HabitatMode = "land" | "aquatic" | "shoreline";

function isBroadYellowstoneLandClashEnv(env: string): boolean {
  const envLower = env.toLowerCase();
  return (
    envLower.includes("yellowstone") &&
    (envLower.includes("meadow") ||
      envLower.includes("open wilderness") ||
      envLower.includes("grassland") ||
      envLower.includes("prairie"))
  );
}

function isExplicitWaterForwardEnv(env: string): boolean {
  const envLower = env.toLowerCase();
  const hasStrongWaterMarker =
    envLower.includes("waterline") ||
    envLower.includes("underwater") ||
    envLower.includes("riverbank") ||
    envLower.includes("bank") ||
    envLower.includes("shoreline") ||
    envLower.includes("shore") ||
    envLower.includes("shallow current") ||
    envLower.includes("current") ||
    envLower.includes("rapids") ||
    envLower.includes("water ") ||
    envLower.startsWith("water") ||
    envLower.includes("lake") ||
    envLower.includes("swamp") ||
    envLower.includes("ocean") ||
    envLower.includes("sea") ||
    envLower.includes("reef") ||
    envLower.includes("coast") ||
    envLower.includes("marine");

  if (isBroadYellowstoneLandClashEnv(env)) {
    return hasStrongWaterMarker;
  }

  return hasStrongWaterMarker || envLower.includes("river");
}

export function isAquaticEnv(env: string): boolean {
  if (isBroadYellowstoneLandClashEnv(env) && !isExplicitWaterForwardEnv(env)) {
    return false;
  }

  return isExplicitWaterForwardEnv(env);
}

function isAquaticAnimal(name: string): boolean {
  const n = name.toLowerCase();
  return [
    "shark",
    "orca",
    "dolphin",
    "seal",
    "fish",
    "whale",
    "octopus",
    "squid",
    "sea lion",
    "walrus",
    "penguin",
    "otter",
    "crocodile",
    "alligator",
    "caiman",
    "hippo",
  ].some((x) => n.includes(x));
}

function isSemiAquaticPredator(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("crocodile") || n.includes("alligator") || n.includes("caiman");
}

export function getHabitatMode(predator: string, prey: string, env: string): HabitatMode {
  const envAquatic = isAquaticEnv(env);
  const predatorAquatic = isAquaticAnimal(predator);
  const preyAquatic = isAquaticAnimal(prey);
  const semiAquaticPred = isSemiAquaticPredator(predator);

  if (predatorAquatic && preyAquatic && envAquatic) return "aquatic";
  if (semiAquaticPred && !preyAquatic) return "shoreline";
  if (envAquatic && predatorAquatic && !preyAquatic) return "shoreline";
  return "land";
}

export function oneActionArcBeat(
  arc: Arc,
  beat: "establish" | "action" | "aftermath",
  enabled: boolean,
  habitatMode: HabitatMode = "land"
): { predatorBeat: string; preyBeat: string; guardLine: string } {
  if (habitatMode === "aquatic") {
    const baseGuard =
      "ONE-ACTION GATE — one primary predator action + one prey reaction only (no stacked beats).";

    if (!enabled) {
      if (beat === "action") {
        return {
          predatorBeat: "commits to one clear forward surge through the water",
          preyBeat: "answers with one readable evasive dart",
          guardLine: "",
        };
      }
      if (beat === "aftermath") {
        return {
          predatorBeat: "slows and settles into a controlled glide",
          preyBeat: "repositions once and holds distance in the current, fully alert",
          guardLine: "",
        };
      }
      return {
        predatorBeat: "holds a coiled pre-strike glide with restrained movement",
        preyBeat: "locks attention and holds a tense hover once",
        guardLine: "",
      };
    }

    switch (arc) {
      case "Chase and takedown":
        if (beat === "action") {
          return {
            predatorBeat: "accelerates into a single chase surge through the water",
            preyBeat: "breaks into one clean escape dart with one evasive direction change",
            guardLine: `${baseGuard}\nChase gate: this shot is chase-only (no capture/contact actions).`,
          };
        }
        if (beat === "aftermath") {
          return {
            predatorBeat: "slows into a controlled glide as turbulence fades",
            preyBeat: "repositions once and holds distance, fully alert",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat: "holds a coiled pre-chase glide with restrained movement",
          preyBeat: "locks attention and freezes once in the water column",
          guardLine: baseGuard,
        };

      case "Ambush attack":
        if (beat === "action") {
          return {
            predatorBeat: "launches once from cover with one decisive forward surge",
            preyBeat: "reacts once with a sharp evasive dart and turn",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "settles into a slower glide as the water stabilizes"
              : "compresses into a low-tension glide, movement tightly controlled",
          preyBeat:
            beat === "aftermath"
              ? "stabilizes position once, still alert"
              : "stiffens and locks attention once",
          guardLine: baseGuard,
        };

      case "Escape from danger":
        if (beat === "action") {
          return {
            predatorBeat: "commits once toward the target with a single pressure surge",
            preyBeat: "executes one desperate escape burst through the water",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "halts forward pressure and glides once, fully aware"
              : "builds pressure without closing distance",
          preyBeat:
            beat === "aftermath"
              ? "regains stable position once, still tense"
              : "tenses and prepares to flee",
          guardLine: baseGuard,
        };

      case "Territory dominance battle":
        if (beat === "action") {
          return {
            predatorBeat: "presses forward once in a controlled dominance surge",
            preyBeat: "answers once with a single threat display or retreating shift",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "holds position and settles into a composed glide"
              : "holds space with still dominance",
          preyBeat:
            beat === "aftermath"
              ? "holds distance, posture tight"
              : "stays tense, watching",
          guardLine: baseGuard,
        };

      case "Predator vs predator fight":
        if (beat === "action") {
          return {
            predatorBeat: "commits one forward pressure beat with a single clash moment",
            preyBeat: "responds once with one counter-shift or recoil",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "resets spacing and settles into a controlled glide"
              : "circles pressure slowly without contact",
          preyBeat:
            beat === "aftermath"
              ? "rebalances once, eyes locked"
              : "mirrors spacing, ready",
          guardLine: baseGuard,
        };

      case "Pack hunting strategy":
        if (beat === "action") {
          return {
            predatorBeat: "tightens formation once with one coordinated lateral close-in",
            preyBeat: "reacts once by pivoting toward one escape lane",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "holds formation and eases into a steady glide"
              : "maintains disciplined spacing",
          preyBeat:
            beat === "aftermath"
              ? "holds distance, still tense"
              : "stays alert, scanning",
          guardLine: baseGuard,
        };

      case "Defender stands ground":
        if (beat === "action") {
          return {
            predatorBeat: "drives one decisive forward defense surge",
            preyBeat: "reacts once with one recoil or lateral slip",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "holds position as motion settles"
              : "holds a planted defensive line in the water",
          preyBeat:
            beat === "aftermath"
              ? "keeps distance, posture tight"
              : "tests space, cautious",
          guardLine: baseGuard,
        };

      case "Giant vs giant clash":
        if (beat === "action") {
          return {
            predatorBeat: "loads pressure and commits one heavy clash beat",
            preyBeat: "responds once with one grounded shove or recoil through the water",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "settles mass and eases into a slower glide"
              : "approaches slowly with heavy pressure through the water",
          preyBeat:
            beat === "aftermath"
              ? "rebalances once, still tense"
              : "holds ground, ready",
          guardLine: baseGuard,
        };

      default:
        return {
          predatorBeat:
            beat === "action"
              ? "commits to one clear forward surge"
              : "holds tension with controlled movement",
          preyBeat:
            beat === "action"
              ? "answers with one survival reaction"
              : "stays alert and reactive",
          guardLine: baseGuard,
        };
    }
  }

  if (habitatMode === "shoreline") {
    const baseGuard =
      "ONE-ACTION GATE — one primary predator action + one prey reaction only (no stacked beats).";

    if (!enabled) {
      if (beat === "action") {
        return {
          predatorBeat: "commits to one explosive shoreline surge from the water's edge",
          preyBeat: "answers with one sharp evasive leap or turn",
          guardLine: "",
        };
      }
      if (beat === "aftermath") {
        return {
          predatorBeat: "settles low at the waterline as disturbed water fades",
          preyBeat: "repositions once on unstable footing, still fully alert",
          guardLine: "",
        };
      }
      return {
        predatorBeat: "holds a low concealed ambush posture at the water's edge",
        preyBeat: "locks attention and stiffens once near the bank",
        guardLine: "",
      };
    }

    switch (arc) {
      case "Ambush attack":
        if (beat === "action") {
          return {
            predatorBeat: "launches once from the waterline with one decisive forward surge",
            preyBeat: "reacts once with a sharp evasive jump and turn away from the bank",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "settles low at the edge as splash and mud disturbance fade"
              : "compresses low in concealment at the water's edge, breath controlled",
          preyBeat:
            beat === "aftermath"
              ? "stabilizes footing once, still alert"
              : "stiffens and locks attention once",
          guardLine: baseGuard,
        };

      case "Chase and takedown":
        if (beat === "action") {
          return {
            predatorBeat: "bursts once from the edge with one grounded pursuit lunge",
            preyBeat: "breaks into one desperate escape sprint with one lane change",
            guardLine: `${baseGuard}\nChase gate: this shot is chase-only (no contact/capture actions).`,
          };
        }
        if (beat === "aftermath") {
          return {
            predatorBeat: "slows at the edge and resets posture with one heavy breath release",
            preyBeat: "repositions once and holds distance, fully alert",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat: "holds a coiled shoreline pre-chase stance",
          preyBeat: "locks attention and freezes once",
          guardLine: baseGuard,
        };

      default:
        if (beat === "action") {
          return {
            predatorBeat: "commits to one decisive shoreline surge",
            preyBeat: "answers with one readable survival reaction",
            guardLine: baseGuard,
          };
        }
        if (beat === "aftermath") {
          return {
            predatorBeat: "settles posture at the edge as water and debris calm down",
            preyBeat: "repositions once and holds distance, fully alert",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat: "holds tension in a low shoreline ambush posture",
          preyBeat: "stays alert and reactive",
          guardLine: baseGuard,
        };
    }
  }

  if (!enabled) {
    if (beat === "action") {
      return {
        predatorBeat: `commits to the ${getSafeArcLabel(arc)} beat with one clear movement`,
        preyBeat: "answers with one readable survival reaction",
        guardLine: "",
      };
    }
    if (beat === "aftermath") {
      return {
        predatorBeat: "slows and resets posture with one heavy breath release",
        preyBeat: "repositions once and holds distance, fully alert",
        guardLine: "",
      };
    }
    return {
      predatorBeat: "holds a coiled pre-action stance and exhales once",
      preyBeat: "locks attention and holds still once",
      guardLine: "",
    };
  }

  const baseGuard =
    "ONE-ACTION GATE — one primary predator action + one prey reaction only (no stacked beats).";

  switch (arc) {
    case "Chase and takedown":
      if (beat === "action") {
        return {
          predatorBeat: "accelerates into a single chase burst with grounded strides (no contact yet)",
          preyBeat: "breaks into one clean escape sprint with one evasive lane change",
          guardLine: `${baseGuard}\nChase gate: this shot is chase-only (no contact/capture actions).`,
        };
      }
      if (beat === "aftermath") {
        return {
          predatorBeat: "slows down and resets stance with one heavy breath release",
          preyBeat: "repositions once and holds distance, fully alert",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: "holds a coiled pre-chase stance and exhales once",
        preyBeat: "locks attention and freezes once",
        guardLine: baseGuard,
      };

    case "Ambush attack":
      if (beat === "action") {
        return {
          predatorBeat: "launches once from cover with one decisive forward commitment",
          preyBeat: "reacts once with a sharp evasive jump and turn",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "settles posture once, stance recovered"
            : "compresses low and still, breath controlled",
        preyBeat:
          beat === "aftermath"
            ? "stabilizes footing once, still alert"
            : "stiffens and locks attention once",
        guardLine: baseGuard,
      };

    case "Escape from danger":
      if (beat === "action") {
        return {
          predatorBeat: "commits once toward the target with a single forward pressure move",
          preyBeat: "executes one desperate escape move (one dodge or sprint burst)",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "halts and scans once, breath visible"
            : "builds pressure without advancing",
        preyBeat:
          beat === "aftermath"
            ? "regains footing once, still tense"
            : "tenses and prepares to flee",
        guardLine: baseGuard,
      };

    case "Territory dominance battle":
      if (beat === "action") {
        return {
          predatorBeat: "steps forward once in a controlled dominance advance",
          preyBeat: "answers once with a single threat display or retreat step",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "stands composed and exhales once"
            : "holds ground with still dominance",
        preyBeat:
          beat === "aftermath"
            ? "holds distance, posture tight"
            : "stays tense, watching",
        guardLine: baseGuard,
      };

    case "Predator vs predator fight":
      if (beat === "action") {
        return {
          predatorBeat: "commits one forward pressure beat (one shove / push / clash moment)",
          preyBeat: "responds once with one counter-step or recoil",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "resets stance and exhales once"
            : "circles pressure slowly without contact",
        preyBeat:
          beat === "aftermath"
            ? "rebalances once, eyes locked"
            : "mirrors stance, ready",
        guardLine: baseGuard,
      };

    case "Pack hunting strategy":
      if (beat === "action") {
        return {
          predatorBeat: "tightens formation once (one coordinated lateral close-in)",
          preyBeat: "reacts once by pivoting and attempting one escape direction",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "holds formation and settles once"
            : "maintains disciplined spacing",
        preyBeat:
          beat === "aftermath"
            ? "holds distance, still tense"
            : "stays alert, scanning",
        guardLine: baseGuard,
      };

    case "Defender stands ground":
      if (beat === "action") {
        return {
          predatorBeat: "drives one decisive forward defense step (one push)",
          preyBeat: "reacts once with one recoil or sidestep",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "stands firm, breath settling"
            : "plants stance, head lowered",
        preyBeat:
          beat === "aftermath"
            ? "keeps distance, posture tight"
            : "tests space, cautious",
        guardLine: baseGuard,
      };

    case "Giant vs giant clash":
      if (beat === "action") {
        return {
          predatorBeat: "loads weight and commits one heavy clash beat (single impact moment)",
          preyBeat: "responds once with one grounded shove or recoil",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "settles weight and exhales once"
            : "approaches slowly with heavy weight transfer",
        preyBeat:
          beat === "aftermath"
            ? "rebalances once, still tense"
            : "holds ground, ready",
        guardLine: baseGuard,
      };

    default:
      return {
        predatorBeat:
          beat === "action"
            ? "commits to one clear movement beat"
            : "holds tension with controlled breath",
        preyBeat:
          beat === "action"
            ? "answers with one survival reaction"
            : "stays alert and reactive",
        guardLine: baseGuard,
      };
  }
}

export function buildMicroMotionLine(weather: Weather, env: string): string {
  const envLower = env.toLowerCase();
  const isWaterForward = isAquaticEnv(env);

  const isArctic =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");

  if (isWaterForward) {
    if (weather === "Storm") {
      return "choppy surface movement, wave slap, underwater particulate drift, foam disturbance, current-driven motion";
    }
    if (weather === "Golden Hour") {
      return "surface ripples catching warm light, gentle wave movement, shifting caustic reflections, suspended particles drifting in water";
    }
    if (weather === "Winter Blizzard" || weather === "Frozen Dusk") {
      return "cold surface disturbance, drifting ice particles, subtle current movement, freezing water atmosphere";
    }
    return "water ripples, current-driven movement, shifting surface reflections, suspended particles drifting naturally";
  }

  if (isArctic) {
    if (weather === "Golden Hour") {
      return "subtle frozen-brush sway, light fur movement, clean cold-air stillness, gentle pine movement in warm backlight";
    }
    return "subtle frozen-ground movement, light fur movement, clean cold-air stillness, faint terrain movement across frozen ground";
  }

  if (weather === "Winter Blizzard" || weather === "Frozen Dusk") {
    return "subtle frozen-brush sway, light fur movement, clean cold-air stillness, faint distant brush movement";
  }

  if (weather === "Storm") {
    return "wind pressure through foliage, rain disturbance, loose surface response reacting to gusts";
  }

  if (weather === "Golden Hour") {
    return "subtle grass sway, light fur movement, stable clean air, gentle background vegetation movement";
  }

  return "subtle foliage sway, stable clean air, light environmental reaction around the subjects";
}

export function buildSeedanceBackgroundMotion(
  habitatMode: HabitatMode,
  micro: string,
  beat: "establish" | "pressure" | "action" | "aftermath"
): string {
  if (habitatMode === "aquatic") {
    if (beat === "pressure") {
      return "Water surface tension increases, ripples widen gently, and suspended particles drift faster through the current.";
    }
    if (beat === "action") {
      return "Water ripples spread quickly, spray kicks outward, and suspended particles drift with the current.";
    }
    if (beat === "aftermath") {
      return "Water settles in layered ripples while light surface movement remains visible.";
    }
    return "Water surface ripples gently and suspended particles drift naturally with the current.";
  }

  if (habitatMode === "shoreline") {
    if (beat === "pressure") {
      return "Shallow ripples widen across the bank, reeds sway more visibly, and wet mud loosens under building pressure.";
    }
    if (beat === "action") {
      return "Shallow water splashes outward, wet mud scatters sharply, and reeds react in quick bursts.";
    }
    if (beat === "aftermath") {
      return "Shallow ripples slow down and the disturbed bank settles naturally.";
    }
    return "Reeds sway lightly, shallow water shifts gently, and the muddy bank shows subtle movement.";
  }

  if (beat === "pressure") {
    return `Background movement builds gradually with ${micro}. Grass and loose debris react with controlled growing tension.`;
  }
  if (beat === "action") {
    return `Ground cover reacts quickly with ${micro}. Loose debris and grass move with the action.`;
  }
  if (beat === "aftermath") {
    return `Background motion settles naturally with ${micro}.`;
  }
  return `Background movement stays subtle with ${micro}.`;
}

export function stripBackgroundMovementLead(text: string): string {
  return String(text ?? "")
    .replace(/^Background movement\s*/i, "")
    .trim();
}
