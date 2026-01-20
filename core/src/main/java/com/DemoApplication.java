package com;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.example.demo.config.UspsApiProperties;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan(basePackages = "com.example.demo.config")
@EnableConfigurationProperties(UspsApiProperties.class)
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
