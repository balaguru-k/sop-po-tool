package sop_po.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

import sop_po.jwt.AuthEntryPointJwt;
import sop_po.security.service.UserDetailsServiceImpl;
import sop_po.jwt.AuthTokenFilter;

@Configuration

@EnableMethodSecurity
public class WebSecurityConfig  {
	 @Autowired
	  UserDetailsServiceImpl userDetailsService;

	  @Autowired
	  private AuthEntryPointJwt unauthorizedHandler;

	  @Bean
	  public AuthTokenFilter authenticationJwtTokenFilter() {
	    return new AuthTokenFilter();
	  }

	  @Bean
	  public DaoAuthenticationProvider authenticationProvider() {
	    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

	    authProvider.setUserDetailsService(userDetailsService);
	    authProvider.setPasswordEncoder(passwordEncoder());

	    return authProvider;
	  }

	  @Bean
	  public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
	    return authConfig.getAuthenticationManager();
	  }

	  @Bean
	  public PasswordEncoder passwordEncoder() {
	      return new BCryptPasswordEncoder();
	  }
	  

	  @Bean
	  public SecurityFilterChain filterChain(HttpSecurity http,HandlerMappingIntrospector introspector) throws Exception {
		    MvcRequestMatcher registerMatcher = new MvcRequestMatcher(introspector, "/register/**");
	        MvcRequestMatcher loginMatcher = new MvcRequestMatcher(introspector, "/login/**");
	        MvcRequestMatcher swaggerMatcher = new MvcRequestMatcher(introspector, "/swagger-ui/**");
	        MvcRequestMatcher swagger2Matcher = new MvcRequestMatcher(introspector, "/v3/api-docs/**");
	        MvcRequestMatcher swagger2Matcher1 = new MvcRequestMatcher(introspector, "/ui");
	        MvcRequestMatcher swagger6Matcher = new MvcRequestMatcher(introspector, "/swagger-ui.html");
			MvcRequestMatcher websocket = new MvcRequestMatcher(introspector, "/ws/**");
			MvcRequestMatcher ebriefTickets = new MvcRequestMatcher(introspector, "/ticket/ebrief/**");
			MvcRequestMatcher brandRoiData = new MvcRequestMatcher(introspector, "/ticket/brand-po-data/**");
	 
	        MvcRequestMatcher webMatcher = new MvcRequestMatcher(introspector, "/web/home");
	    http.csrf(csrf -> csrf.disable())
	        .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
	        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
	        .authorizeHttpRequests(auth -> auth.requestMatchers("/api/auth/**").permitAll().requestMatchers("/**").permitAll()
	        		.requestMatchers(registerMatcher).permitAll()
                    .requestMatchers(loginMatcher).permitAll()
                    .requestMatchers(swaggerMatcher).permitAll()
                    .requestMatchers(swagger2Matcher).permitAll()
                    .requestMatchers(swagger2Matcher1).permitAll()
                    .requestMatchers(swagger6Matcher).permitAll()
                    .requestMatchers(websocket).permitAll()
                    .requestMatchers(ebriefTickets).permitAll()
					.requestMatchers(brandRoiData).permitAll()
                    .anyRequest().authenticated());

	    http.authenticationProvider(authenticationProvider());

	    http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

	    return http.build();
	  }

}
