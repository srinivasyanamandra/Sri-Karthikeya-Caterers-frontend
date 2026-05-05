package syncqubits.ai.skc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import syncqubits.ai.skc.config.AppProperties;
import syncqubits.ai.skc.dto.auth.LoginRequest;
import syncqubits.ai.skc.dto.auth.LoginResponse;
import syncqubits.ai.skc.exception.UnauthorizedException;
import syncqubits.ai.skc.security.JwtService;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AppProperties appProperties;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SystemLogService systemLogService;

    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Login attempt for email: {}", request.getEmail());

        // Validate credentials against hardcoded admin list
        if (!isValidAdmin(request.getEmail(), request.getPassword())) {
            systemLogService.logAuth("login", "failed", request.getEmail(), ipAddress, userAgent);
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Email or password is incorrect.");
        }

        // Generate JWT token
        String token = jwtService.generateToken(request.getEmail());
        var expiresAt = jwtService.getExpirationFromToken(token);

        systemLogService.logAuth("login", "success", request.getEmail(), ipAddress, userAgent);

        return LoginResponse.builder()
                .token(token)
                .expiresAt(expiresAt)
                .user(LoginResponse.UserInfo.builder()
                        .email(request.getEmail())
                        .role("ADMIN")
                        .build())
                .build();
    }

    private boolean isValidAdmin(String email, String password) {
        var adminEmails = appProperties.getAdmin().getEmails();
        var adminPasswords = appProperties.getAdmin().getPasswords();

        if (adminEmails == null || adminPasswords == null) {
            log.error("Admin credentials not configured");
            return false;
        }

        for (int i = 0; i < adminEmails.size(); i++) {
            if (adminEmails.get(i).equalsIgnoreCase(email)) {
                String storedPassword = adminPasswords.get(i);
                
                // Check if password is BCrypt hashed or plain text
                if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
                    return passwordEncoder.matches(password, storedPassword);
                } else {
                    // Plain text comparison (for development only)
                    return password.equals(storedPassword);
                }
            }
        }

        return false;
    }
}
