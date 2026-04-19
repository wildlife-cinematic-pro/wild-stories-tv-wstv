"use client";

import { useMemo, useState } from "react";

import { habitatPromptMap } from "@/lib/habitat-presets";
import { predatorData, suggestArc } from "@/lib/predator-data";
import {
  readCustomPredators,
  writeCustomPredators,
} from "@/lib/storage";

import type {
  Arc,
  CustomPredatorForm,
  HabitatPreset,
  PredatorInfo,
} from "@/types";

export type CustomAnimalFormState = {
  name: string;
  prey: string;
  environment: string;
  defaultArc: string;
  driftRisk: PredatorInfo["driftRisk"];
};

type CustomAnimalSelection = {
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
};

type UseCustomAnimalsInput = {
  currentPredator: string;
  defaultPrey: string;
  defaultHabitat: HabitatPreset;
  onSelectCustomAnimal: (selection: CustomAnimalSelection) => void;
  onResetDefaults: () => void;
};

const defaultCustomForm: CustomAnimalFormState = {
  name: "",
  prey: "",
  environment: habitatPromptMap["Rocky Mountain Meadow"],
  defaultArc: "Pack hunting strategy",
  driftRisk: "MEDIUM",
};

export function useCustomAnimals({
  currentPredator,
  defaultPrey,
  defaultHabitat,
  onSelectCustomAnimal,
  onResetDefaults,
}: UseCustomAnimalsInput) {
  const [customPredators, setCustomPredators] = useState<CustomPredatorForm[]>(
    () => readCustomPredators()
  );
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] =
    useState<CustomAnimalFormState>(defaultCustomForm);

  const predatorOptions = useMemo(() => {
    const base = Object.keys(predatorData);
    const extra = customPredators.map((item) => item.name);
    const usaPriority = [
      "Mountain Lion",
      "Wolf Pack",
      "Grizzly Bear",
      "Alligator",
      "Bison",
      "Coyote",
      "Bald Eagle",
      "Moose",
      "Bull Elk",
      "Black Bear",
      "Cougar",
      "Bobcat",
      "Wolf",
      "Wild Boar",
      "Great Horned Owl",
      "Red Fox",
      "Beaver",
      "River Otter",
      "Badger",
      "Raccoon",
      "White-tailed Deer",
      "Dolphin",
      "Orca",
      "Shark",
    ];
    const all = Array.from(new Set([...base, ...extra]));

    return all.sort((a, b) => {
      const ai = usaPriority.indexOf(a);
      const bi = usaPriority.indexOf(b);
      const aPinned = ai !== -1;
      const bPinned = bi !== -1;

      if (aPinned && bPinned) return ai - bi;
      if (aPinned) return -1;
      if (bPinned) return 1;
      return a.localeCompare(b);
    });
  }, [customPredators]);

  function openCustomAnimalModal({
    defaultArc,
    driftRisk,
  }: {
    defaultArc: Arc | string;
    driftRisk: PredatorInfo["driftRisk"];
  }) {
    setCustomForm({
      name: "",
      prey: "",
      environment: habitatPromptMap["Rocky Mountain Meadow"],
      defaultArc: defaultArc || "Pack hunting strategy",
      driftRisk,
    });
    setCustomModalOpen(true);
  }

  function saveCustomAnimal() {
    const name = customForm.name.trim();
    if (!name) return;

    const builtInAnimalExists = Object.prototype.hasOwnProperty.call(
      predatorData,
      name
    );
    if (builtInAnimalExists) {
      alert("This animal already exists in the built-in list.");
      return;
    }

    const normalizedName = name.toLowerCase();
    const normalizedPrey = Array.from(
      new Set(
        customForm.prey
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
    const selectedPrey = normalizedPrey[0] || defaultPrey;
    const entry: CustomPredatorForm = {
      name,
      prey: normalizedPrey.length ? normalizedPrey.join(", ") : "White-tailed Deer",
      environment:
        customForm.environment.trim() || habitatPromptMap["Rocky Mountain Meadow"],
      defaultArc: customForm.defaultArc || "Pack hunting strategy",
      driftRisk: customForm.driftRisk,
    };

    setCustomPredators((prev) => {
      const next = prev
        .filter((item) => item.name.trim().toLowerCase() !== normalizedName)
        .concat(entry);
      writeCustomPredators(next);
      return next;
    });

    onSelectCustomAnimal({
      predator: name,
      prey: selectedPrey,
      arc: suggestArc(name, selectedPrey, entry.defaultArc) as Arc,
      habitat: defaultHabitat,
    });
    setCustomModalOpen(false);
  }

  function deleteCustomAnimal() {
    const name = customForm.name.trim();
    if (!name) return;

    setCustomPredators((prev) => {
      const next = prev.filter(
        (item) => item.name.trim().toLowerCase() !== name.toLowerCase()
      );
      writeCustomPredators(next);
      return next;
    });

    if (currentPredator === name) {
      onResetDefaults();
    }

    setCustomModalOpen(false);
  }

  return {
    customPredators,
    customModalOpen,
    customForm,
    predatorOptions,
    setCustomModalOpen,
    setCustomForm,
    openCustomAnimalModal,
    saveCustomAnimal,
    deleteCustomAnimal,
  };
}
