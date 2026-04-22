"use client";

import { useMemo, useState } from "react";

import { habitatPromptMap } from "@/lib/habitat-presets";
import {
  filterPredatorOptionsByWildlifeScope,
  predatorData,
  suggestArc,
} from "@/lib/predator-data";
import {
  readCustomPredators,
  writeCustomPredators,
} from "@/lib/storage";

import type {
  Arc,
  CustomPredatorForm,
  HabitatPreset,
  PredatorInfo,
  WildlifeScopeMode,
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
  wildlifeScopeMode: WildlifeScopeMode;
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
  wildlifeScopeMode,
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
    const builtInOptions = filterPredatorOptionsByWildlifeScope(
      Object.keys(predatorData),
      wildlifeScopeMode
    );
    const customOptions = customPredators
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b));

    return Array.from(new Set([...builtInOptions, ...customOptions]));
  }, [customPredators, wildlifeScopeMode]);

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
