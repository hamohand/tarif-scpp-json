package com.muhend.backend.controller;

import com.muhend.backend.model.Section;
import com.muhend.backend.service.SectionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
// --- IMPORTANT --- *******************************************************************
// On supprime "/api" du mapping, car Traefik le gère déjà.
// Spring ne verra que le chemin "/chapitres".
// Modifier @RequestMapping("/api/chapitres")
// ***********************************************************************************
@RequestMapping("/api/sections")
public class SectionController {
    private final SectionService sectionService;
    public SectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    // Get all sections
    @GetMapping
    Iterable<Section> getAllSections() {
        return sectionService.getAllSections();
    }
}
