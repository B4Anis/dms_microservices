package com.example.documents.security;

public class JwtClaimsPrincipal {

    private final String email;
    private final String departmentId;
    private final String role;

    public JwtClaimsPrincipal(String email, String departmentId, String role) {
        this.email = email;
        this.departmentId = departmentId;
        this.role = role;
    }

    public String getEmail() { return email; }
    public String getDepartmentId() { return departmentId; }
    public String getRole() { return role; }
}
