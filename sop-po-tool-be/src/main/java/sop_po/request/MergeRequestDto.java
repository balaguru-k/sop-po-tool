package sop_po.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sop_po.entity.FileType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MergeRequestDto {
    private String fileName;
    private int totalChunks;
    private FileType distinationFileLocation;
}
