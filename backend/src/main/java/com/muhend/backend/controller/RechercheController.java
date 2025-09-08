package com.muhend.backend.controller;

import com.muhend.backend.model.*;
import com.muhend.backend.service.ChapitreService;
import com.muhend.backend.service.Position4Service;
import com.muhend.backend.service.Position6DzService;
import com.muhend.backend.service.SectionService;
import com.muhend.backend.service.ai.AiPrompts;
import com.muhend.backend.service.ai.AiService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@Data
// --- IMPORTANT --- *******************************************************************
// On supprime "/api" du mapping, car Traefik le gère déjà.
// Spring ne verra que le chemin "/recherche".
// ***********************************************************************************
@RequestMapping("/api/recherche")
//@RequestMapping("/recherche") // pour Traefik
@CrossOrigin(
        origins = {"http://localhost:4300", "http://217.65.146.13:4300"},
        methods = {RequestMethod.GET, RequestMethod.POST}
)

public class RechercheController {
    private final AiService aiService;
    private final AiPrompts aiPrompts;
    private final SectionService sectionService;
    private final ChapitreService chapitreService;
    private final Position4Service position4Service;
    private final Position6DzService position6DzService;

    @Autowired
    public RechercheController(AiService aiService, AiPrompts aiPrompts, SectionService sectionService, ChapitreService chapitreService,
                               Position4Service position4Service, Position6DzService position6DzService) {
        this.aiService = aiService;
        this.aiPrompts = aiPrompts;
        this.sectionService = sectionService;
        this.chapitreService = chapitreService;
        this.position4Service = position4Service;
        this.position6DzService = position6DzService;
    }

    // Enumération des différents niveaux de recherche
    private enum SearchLevel {
        SECTIONS, CHAPITRES, POSITIONS4, POSITIONS6
    }

    //****************************************************************************************
    // --------------------------------- ENDPOINTS DE RECHERCHE -----------------------------
    //****************************************************************************************

    // Niveau de recherche 0 : sections
    @GetMapping(value = "/sections", produces = "application/json")
    public List<Position> reponseSections(@RequestParam String termeRecherche) {
        return handleSearchRequest(termeRecherche, SearchLevel.SECTIONS);
    }

    // Niveau de recherche 1 : chapitres
    @GetMapping(path = "/chapitres", produces = "application/json")
    public List<Position> reponseChapitres(@RequestParam String termeRecherche) {
        return handleSearchRequest(termeRecherche, SearchLevel.CHAPITRES);
    }

    // Niveau de recherche 2 : positions 4
    @GetMapping(path = "/positions4", produces = "application/json")
    public List<Position> reponsePositions4(@RequestParam String termeRecherche) {
        return handleSearchRequest(termeRecherche, SearchLevel.POSITIONS4);
    }

    // Niveau de recherche 3 : positions 6
    @GetMapping(path = "/positions6", produces = "application/json")
    public List<Position> reponsePositions6(@RequestParam String termeRecherche) {
        return handleSearchRequest(termeRecherche, SearchLevel.POSITIONS6);
    }


    //****************************************************************************************
    // --------------------------------- LOGIQUE DE RECHERCHE EN CASCADE --------------------
    //****************************************************************************************

    private List<Position> handleSearchRequest(String termeRecherche, SearchLevel maxLevel) {
        // Chaine response générale
        //StringBuilder reponseChaine = new StringBuilder();
        List<Position> reponseList = new ArrayList<>();
        //
        //Positions du niveau
        List<Position> positions;
        // Réponse du niveau
        List<Position> reponseListLevel = new ArrayList<>();
        // RAG du niveau
        List<Position> ragNiveau;
        // Liste des codes des positions du niveau
        List<String> codes = new ArrayList<>();
        // Nombre de tentatives de recherche d'un terme si la recherche n'est pas fructueuse (limité à 2 pour le moment)
        int tentativesMax = 2;
        // Nombre de tokens utilisés
        int tokensUsed = 0;

        // --------------------------- Level 0 : Sections ---------------------------------------
        ragNiveau = ragSections();
        //IA
        int nbTentatives = 0; // nombre de tentatives de recherche IA
        do {
            nbTentatives++;
            positions = aiService.promptEtReponse(SearchLevel.SECTIONS.toString(), termeRecherche, ragNiveau); // AI: recherche des positions du niveau
        } while (nbTentatives < tentativesMax && positions.isEmpty());
        if (positions.isEmpty()) {
            return null;
        }

        // Description
        if (aiPrompts.defTheme.isWithDescription()) { // affichage avec les descriptions
            for (Position position : positions) {
                String code = position.getCode();
                String description = sectionService.getDescription(code.trim());
                position.setDescription(description);
            }
        }
        // Résultat du niveau
        reponseListLevel.addAll(positions);
        // Cascade
        if (aiPrompts.defTheme.isWithCascade()) { // ajout du niveau au résultat général
            reponseList.addAll(reponseListLevel);
        }
        // si niveau demandé
        if (maxLevel == SearchLevel.SECTIONS) {
            if (!aiPrompts.defTheme.isWithCascade()) { // reponseList contiendra le résultat du niveau courant uniquement
                return reponseListLevel;
            } else {
                return reponseList;
            }
        }


        // ----------------------------- Level 1: Chapitres ----------------------------------------
        reponseListLevel.clear(); // On réinitialise la liste des positions du niveau courant
        ragNiveau = ragChapitres(positions); // calcul du RAG avec les positions des sections trouvées ci-dessus. Si pas de sections on utilise la liste des chapitres
        nbTentatives = 0; // nombre de tentatives de recherche IA
        do {
            nbTentatives++;
            positions = aiService.promptEtReponse(SearchLevel.CHAPITRES.toString(), termeRecherche, ragNiveau); // AI: recherche des positions du niveau
        } while (nbTentatives < tentativesMax && positions.isEmpty());
        if (positions.isEmpty()) {
            return null;
        }
        // Description
        if (aiPrompts.defTheme.isWithDescription()) { // affichage avec les descriptions
            for (Position position : positions) {
                String code = position.getCode();
                String description = chapitreService.getDescription(code);
                position.setDescription(description);
            }
        }
        // Résultat du niveau
        reponseListLevel.addAll(positions);
        // Cascade
        if (aiPrompts.defTheme.isWithCascade()) { // ajout du niveau au résultat général
            reponseList.addAll(reponseListLevel);
        }
        // Si niveau demandé
        if (maxLevel == SearchLevel.CHAPITRES) {
            if (!aiPrompts.defTheme.isWithCascade()) { // reponseList contiendra le résultat du niveau courant uniquement
                return reponseListLevel;
            } else {
                return reponseList;
            }
        }

        // ------------------------------- Level 2 : Positions 4 -------------------------------------------------
        reponseListLevel.clear(); // On réinitialise la liste des positions du niveau courant
        ragNiveau = ragPositions4(positions); // positions de chapitres
        nbTentatives = 0; // nombre de tentatives de recherche IA
        do {
            nbTentatives++;
            positions = aiService.promptEtReponse(SearchLevel.POSITIONS4.toString(), termeRecherche, ragNiveau); // AI: recherche des positions du niveau
        } while (nbTentatives < tentativesMax && positions.isEmpty());
        List<Position> positionsPositions4 = positions; // écriture en apparence redondante, on stocke positionsPositions4 pour une possible utilisation ultérieure

        if (positions.isEmpty()) {
            return null;
        }
        // Description
        if (aiPrompts.defTheme.isWithDescription()) { // ajout des descriptions
            for (Position position : positions) {
                String code = position.getCode();
                String description = position4Service.getDescription(code);
                position.setDescription(description);
            }
        }
        // Résultat du niveau
        reponseListLevel.addAll(positions);
        // Cascade
        if (aiPrompts.defTheme.isWithCascade()) { // ajout du niveau au résultat général
            reponseList.addAll(reponseListLevel);
        }
        // si niveau demandé
        if (maxLevel == SearchLevel.POSITIONS4) {
            if (!aiPrompts.defTheme.isWithCascade()) { // reponseList contiendra affichage du niveau courant uniquement
                return reponseListLevel;
            }
            return reponseList;
        }

        // ------------------------------- Level 3 : Positions 6 - le plus haut pour le moment-------------------------------------------------
        reponseListLevel.clear(); // On réinitialise la liste des positions du niveau courant
        ragNiveau = ragPositions6(positions); // positions de positions4
        nbTentatives = 0; // nombre de tentatives de recherche IA
        do {
            nbTentatives++;
            positions = aiService.promptEtReponse(SearchLevel.POSITIONS6.toString(), termeRecherche, ragNiveau); // AI: recherche des positions du niveau
        } while (nbTentatives < tentativesMax && positions.isEmpty());
        List<Position> positionsPositions6Dz = positions; // écriture en apparence redondante, on stocke positionsPositions4 pour une possible utilisation ultérieure

        if (positions.isEmpty()) { // Si positionsPositions6 est vide, on affiche le résultat de positionsPositions4
            if (!positionsPositions4.isEmpty()){ // Si positionsPositions4 n'est pas vide
                positions = positionsPositions4;
            } else {
                return null;
            }

        }
        // Description
        if (aiPrompts.defTheme.isWithDescription()) { // ajout des descriptions
            for (Position position : positions) {
                String code = position.getCode();
                String description = position6DzService.getDescription(code);
                position.setDescription(description);
            }
        }
        // Résultat du niveau
        reponseListLevel.addAll(positions);
        // Cascade
        if (aiPrompts.defTheme.isWithCascade()) { // ajout du niveau au résultat général
            reponseList.addAll(reponseListLevel);
        }
        // si niveau demandé
        if (maxLevel == SearchLevel.POSITIONS6) {
            if (!aiPrompts.defTheme.isWithCascade()) { // reponseList contiendra affichage du niveau courant uniquement
                return reponseListLevel;
            }
            return reponseList;
        }
/*
        // -------------------------- Level 3 le plus haut pour le moment : Positions 6 ----------------------------------------
        ragNiveau = ragPositions6(positions);
        List<Position> positionsPositions6 = aiService.promptEtReponse(SearchLevel.POSITIONS6.toString(), termeRecherche, ragNiveau); // AI: recherche des positions du niveau
        positions = positionsPositions6; // cette écriture en apparence redondante, permet de conserver un code analogue aux autres niveaux
        if (positions.isEmpty()) { // Si positionsPositions6 est vide, on affiche le résultat de positionsPositions4
            if (!positionsPositions4.isEmpty()){ // Si positionsPositions4 n'est pas vide
                positions = positionsPositions4;
            } else {
                return "Aucune réponse trouvée. Terme insuffisant, donnez plus de précisions.";
            }

        }
        // Formatage
        reponseChaineLevel = new StringBuilder();
        if (aiPrompts.defTheme.isOnlyCodes()){ // récupérer uniquement le tableau des codes
            codes = positions.stream().map(Position::getCode).collect(Collectors.toList());
            reponseChaineLevel.append(codes);
        } else {
            if (aiPrompts.defTheme.isWithDescription()) { // affichage avec les descriptions
                for (Position position : positions) {
                    String code = position.getCode();
                    String description = position6DzService.getDescription(code);
                    position.setDescription(description);
                }
            }
            reponseChaineLevel.append("\n\n").append(aiService.formatterListeReponsesPourAffichage(SearchLevel.POSITIONS6.toString(), positions));
        }
        // Affichage
        if (aiPrompts.defTheme.isWithCascade()) { // ajout du niveau à l'affichage général (facultatif pour le dernier niveau)
            reponseChaine.append(reponseChaineLevel);
        }
        // si niveau demandé
        if (maxLevel == SearchLevel.POSITIONS6) {
            if (!aiPrompts.defTheme.isWithCascade()) { // reponseChaine contiendra affichage du niveau courant uniquement
                reponseChaine.append(reponseChaineLevel);
            }
            return reponseChaine.toString();
        }
*/
        // Réponse genérale
        //return reponseChaine.toString();
        return reponseList;
    }


    //****************************************************************************************
    // --------------------------------- GÉNÉRATION DU CONTEXTE (RAG) -----------------------
    //****************************************************************************************

    /**
     * Crée le contexte (RAG) pour la recherche de CHAPITRES en listant toutes les sections disponibles.
     *
     * @return Une liste de Positions contenant les sections.
     */
    private List<Position> ragSections() {
        List<Section> results = sectionService.getAllSections();
        return results.stream()
                .map(section -> new Position(section.getCode(), section.getDescription()))
                .collect(Collectors.toList());
    }

    private List<Position> ragChapitres(List<Position> listePositions) {
        if (!listePositions.isEmpty() || listePositions != null) {
            return listePositions.stream()
                    .flatMap(position -> chapitreService.getChapitresBySection(position.getCode()).stream())
                    .map(chapitre -> new Position(chapitre.getCode(), chapitre.getDescription()))
                    .collect(Collectors.toList());
        } else { // si la liste des sections condidates est vide, RAG = liste de tous les chapitres
            List<Chapitre> results = chapitreService.getAllChapitres();
            return results.stream()
                    .map(chapitre -> new Position(chapitre.getCode(), chapitre.getDescription()))
                    .collect(Collectors.toList());
        }
    }

    private List<Position> ragPositions4(List<Position> listePositions) {
        return listePositions.stream()
                .flatMap(position -> {
                    String chapterCodePrefix = position.getCode() + "%";
                    return position4Service.getPosition4sByPrefix(chapterCodePrefix).stream();
                })
                .map(pos4 -> new Position(pos4.getCode(), pos4.getDescription()))
                .collect(Collectors.toList());
    }

    private List<Position> ragPositions6(List<Position> listePositions) {
        return listePositions.stream()
                .flatMap(position -> {
                    String position4CodePrefix = position.getCode() + "%";
                    return position6DzService.getPosition6DzsByPrefix(position4CodePrefix).stream();
                })
                .map(pos6 -> new Position(pos6.getCode(), pos6.getDescription()))
                .collect(Collectors.toList());
    }
}
