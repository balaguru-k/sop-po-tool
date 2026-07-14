package sop_po.response;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
@AllArgsConstructor
@JsonInclude(value = Include.NON_NULL)
@Builder
public class GenericResponse<T> {

    @NonNull
    private Boolean status;
    private String message;
    private String errorType;
    @Builder.Default
    private Long timestamp = System.currentTimeMillis();
    private T data;
    @Builder.Default
    private Map<String, String> errors = Collections.emptyMap();
    @Builder.Default
    private Map<String, List<String>> bulkErrors = null;

    public static <T> GenericResponse<T> success(T data) {
        return GenericResponse.<T>builder()
                .message("Response Success")
                .data(data)
                .errorType("NONE")
                .status(true)
                .build();
    }

    public static <T> GenericResponse<T> success(String message, T data) {
        return GenericResponse.<T>builder()
                .message(message)
                .data(data)
                .errorType("NONE")
                .status(true)
                .build();
    }

    public static <T> GenericResponse<T> error(String errorType, String message) {
        return GenericResponse.<T>builder()
                .message(message)
                .errorType(errorType)
                .status(false)
                .build();
    }

    public static <T> GenericResponse<T> fielderror(String errorType, String message, Map<String, String> errors) {
        return GenericResponse.<T>builder()
                .message(message)
                .errorType(errorType)
                .errors(errors)
                .status(false)
                .build();
    }

    public static <T> GenericResponse<T> bulkErrors(Map<String, List<String>> errors) {
        return GenericResponse.<T>builder()
                .message("Bulk upload failed")
                .errorType("OPERATIONAL")
                .bulkErrors(errors)
                .status(false)
                .build();
    }

    public static <T> GenericResponse<T> failure(String message) {
        return GenericResponse.<T>builder()
                .status(false)
                .message(message)
                .errorType("OPERATIONAL")
                .build();
    }
}