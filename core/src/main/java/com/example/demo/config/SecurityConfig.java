package com.example.demo.config;

import java.util.List;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
  @Value("${admin.username}")
  private String adminUsername;

  @Value("${admin.password}")
  private String adminPassword;
  
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http
      .cors()               // ← enable CORS support
      .and()
      .csrf().disable()     // optional, depending on your needs
      .authorizeRequests()
      .antMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().permitAll()  // or your existing rules
        .and()
        .httpBasic();
  }

  @PostConstruct
  public void debugEnv() {
    System.out.println("Admin user: " + adminUsername);
    System.out.println("Admin pass loaded: " + (adminPassword != null));
  }

  @Bean
  @Override
  public UserDetailsService userDetailsService() {
    UserDetails admin = User.withUsername(adminUsername)
      .password(adminPassword)
      .roles("ADMIN")
      .build();

      return new InMemoryUserDetailsManager(admin);
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
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