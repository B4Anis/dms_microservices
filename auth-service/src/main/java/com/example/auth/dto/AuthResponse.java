package com.example.auth.dto;

public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String role;
    private String departmentId;
    private String firstName;
    private String lastName;

    public AuthResponse(String token, Long id, String email, String role,
                        String departmentId, String firstName, String lastName) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
        this.departmentId = departmentId;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getToken() { return token; }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getDepartmentId() { return departmentId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
}
