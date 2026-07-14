package sop_po.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class ApiResponse {
private boolean status;
private String message;
private Object data;

public ApiResponse(boolean status, String message, Object data) {
    this.status = status;
    this.message = message;
    this.data = data;
}

public ApiResponse() {
}

public ApiResponse(boolean status, String message) {
    this.status = status;
    this.message = message;
}
}
