package syncqubits.ai.skc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SkcApplication {

	public static void main(String[] args) {
		SpringApplication.run(SkcApplication.class, args);
	}

}
