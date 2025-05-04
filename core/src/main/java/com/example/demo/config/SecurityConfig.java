package com.example.demo.config;

import java.util.List;

import org.springframework.context.annotation.Bean;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http
      .cors()               // ← enable CORS support
      .and()
      .csrf().disable()     // optional, depending on your needs
      .authorizeRequests()
        .anyRequest().permitAll();  // or your existing rules
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // allow your React origin
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    // allow all the HTTP methods you need
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    // allow any headers (e.g. Content-Type, Authorization, etc.)
    config.setAllowedHeaders(List.of("*"));
    // if you need to send cookies or auth headers
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    // apply to all /api/** endpoints
    source.registerCorsConfiguration("/api/**", config);
    return source;
  }
}