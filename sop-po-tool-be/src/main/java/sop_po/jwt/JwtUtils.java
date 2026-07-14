package sop_po.jwt;

import java.security.Key;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import sop_po.security.service.UserDetailsImpl;
//import sop_po.security.service.UserDetailsImpl;

@Component
public class JwtUtils {


    // @Value("${======================datacapture===========================}")
    private String jwtSecret = "======================datacapture===========================";

    // @Value("${datacapture.app.jwtExpirationMs}")
    private int jwtExpirationMs = 86400000;

    public String generateJwtToken(Authentication authentication, Map<String, Object> additionalData) {

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject((userPrincipal.getEmail()))
                .addClaims(additionalData)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    // public String generateJwtToken(LoginRequest user, Map<String, Object>
    // additionalData) {
    //
    //
    //
    // return Jwts.builder()
    // .setSubject((String) additionalData.get("name"))
    // .addClaims(additionalData)
    // .setIssuedAt(new Date())
    // .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
    // .signWith(key(), SignatureAlgorithm.HS256)
    // .compact();
    // }
    public String generateJwtTokenEmail(String email, Map<String, Object> additionalData) {

        return Jwts.builder()
                .setSubject(email)
                .addClaims(additionalData)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException e) {

            // logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            // deleteJwtTokenFromLocalStorage();
            return false;
            // logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            // logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            // logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }

    private void deleteJwtTokenFromLocalStorage() {
        // Example assuming the key for your JWT token in local storage is "jwtToken"
        // Replace "jwtToken" with the actual key you used for storing the JWT token

        try {
            // Access local storage
            java.util.prefs.Preferences.userRoot().remove("jwtToken");
        } catch (Exception e) {
            // Handle the exception if accessing local storage fails
            e.printStackTrace();
        }
    }

    public String validateJwtToken1(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return "Token is valid";
        } catch (MalformedJwtException e) {
            // logger.error("Invalid JWT token: {}", e.getMessage());
            return "Invalid JWT token: " + e.getMessage();
        } catch (ExpiredJwtException e) {
            // logger.error("JWT token is expired: {}", e.getMessage());
            return "JWT token is expired: " + e.getMessage();
        } catch (UnsupportedJwtException e) {
            // logger.error("JWT token is unsupported: {}", e.getMessage());
            return "JWT token is unsupported: " + e.getMessage();
        } catch (IllegalArgumentException e) {
            // logger.error("JWT claims string is empty: {}", e.getMessage());
            return "JWT claims string is empty: " + e.getMessage();
        }
    }

    public Date getExpirationDateFromJwtToken(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
        return claims.getExpiration();
    }

    public Map<String, Object> decodeJwtToken(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
        return claims;
    }

    public String generateTokenFromUsernamefromMap(String email, Map<String, Object> privillege) {
        return Jwts.builder()
                .setSubject(email)
                .claim("userDetails", privillege)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Map<String, Object> decodeToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key()) // same key used in generation
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject();
            Map<String, Object> userDetails = claims.get("userDetails", Map.class);
            userDetails.put("email", email);

            return userDetails;

        } catch (JwtException | IllegalArgumentException e) {
            throw new RuntimeException("Invalid or expired token");
        }
    }

    public String generateJWTTokenForResetPassword(String email) {
        long expirationInMillis = 10 * 60 * 1000;

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationInMillis))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Map<String, Object> decodeJWTTokenForResetPassword(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Map<String, Object> data = new HashMap<>();
            data.put("email", claims.getSubject()); // subject contains the email
            data.put("issuedAt", claims.getIssuedAt());
            data.put("expiration", claims.getExpiration());
            return data;

        } catch (ExpiredJwtException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token has expired", e);
        } catch (JwtException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token", e);
        }
    }

    public Map<String, Object> getUserDetailsFromCurrentRequest() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();
            jakarta.servlet.http.HttpServletRequest request = attr.getRequest();
            String token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                return decodeToken(token);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public String getEmail() {
        Map<String, Object> userDetails = getUserDetailsFromCurrentRequest();
        return userDetails != null ? (String) userDetails.get("email") : null;
    }

    public String getActiveRole() {
        Map<String, Object> userDetails = getUserDetailsFromCurrentRequest();
        return userDetails != null ? (String) userDetails.get("activeRole") : null;
    }

    public String getUserId() {
        Map<String, Object> userDetails = getUserDetailsFromCurrentRequest();
        return userDetails != null ? (String) userDetails.get("_id") : null;
    }

    public String getUserName() {
        Map<String, Object> userDetails = getUserDetailsFromCurrentRequest();
        return userDetails != null ? (String) userDetails.get("username") : null;
    }

    public List<String> getUserType() {
        Map<String, Object> userDetails = getUserDetailsFromCurrentRequest();
        return userDetails != null ? (List<String>) userDetails.get("type") : Collections.emptyList();
    }

}