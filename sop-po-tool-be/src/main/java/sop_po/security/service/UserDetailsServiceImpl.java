package sop_po.security.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import sop_po.model.user.User;
import sop_po.repository.UserRepository;

@Service
public class UserDetailsServiceImpl  
implements UserDetailsService
{
	 @Autowired
	  UserRepository userRepository;

	  @Override
	  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
	    User user = userRepository.findByEmail(username)
	        .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username));
	    return UserDetailsImpl.build(user);
	  }


}
