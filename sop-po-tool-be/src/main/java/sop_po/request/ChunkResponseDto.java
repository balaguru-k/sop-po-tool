package sop_po.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChunkResponseDto {
    private String chunkId;
    private int chunkIndex;
    private boolean lastChunk;
}

