package saim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RestServiceApplication {
	public static void main(String[] args) 
	{
		SpringApplication.run(RestServiceApplication.class, args);
	}
}
