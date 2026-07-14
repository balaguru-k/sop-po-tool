package sop_po.controller.user;

import lombok.Data;

@Data
public class UserPasswordForgot {

    private String token;

    private String password;

}
