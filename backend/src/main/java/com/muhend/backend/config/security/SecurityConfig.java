package com.muhend.backend.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. La configuration CORS est conservée et reste active.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. La protection CSRF reste désactivée.
                .csrf(AbstractHttpConfigurer::disable)

                // 3. Toutes les règles d'autorisation sont remplacées par une seule
                //    qui autorise toutes les requêtes, quelles qu'elles soient.
                .authorizeHttpRequests(authz -> authz
                        .anyRequest().permitAll()
                );

        // Tout est désactivé pour le moment
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // --- IMPORTANT ---
        // Remplacez par le domaine exact de votre frontend
        configuration.setAllowedOrigins(List.of("https://tarif.enclume-numerique.com", "https://www.tarif.enclume-numerique.com","http://localhost:4300"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
