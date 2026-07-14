package sop_po.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sop_po.config.WebSocketEventListener;

@Service
public class TopicSubscriptionService {

     @Autowired
    private WebSocketEventListener webSocketEventListener;
    public boolean isTopicSubscribed(String topic) {
        return webSocketEventListener.sessionSubscriptions.values().stream()
                .anyMatch(subscriptions -> subscriptions.contains(topic));
    }
}

