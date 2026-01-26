package com.example.demo.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("""
            select distinct o
            from Order o
            left join fetch o.items
            where o.orderStatus in :statuses
            order by o.createdAt desc
            """)
    List<Order> findWithItemsByStatuses(@Param("statuses") List<OrderStatus> statuses);

    @Query("""
            select distinct o
            from Order o
            left join fetch o.items
            where o.orderStatus = :status
            order by o.createdAt desc
            """)
    List<Order> findWithItemsByStatus(@Param("status") OrderStatus status);

    @EntityGraph(attributePaths = "items")
    List<Order> findByOrderEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Order> findByOrderStatusOrderByCreatedAtAsc(OrderStatus status);

    List<Order> findByNeedsFollowUpTrueAndFollowUpResolvedAtIsNullOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    List<Order> findAllByOrderStatusNotInOrderByCreatedAtAsc(List<OrderStatus> statuses);

    @EntityGraph(attributePaths = "items")
    List<Order> findAllByOrderByCreatedAtAsc();

    @EntityGraph(attributePaths = "items")
    List<Order> findByCreatedAtBetween(Instant start, Instant end);

    @EntityGraph(attributePaths = "items")
    List<Order> findByOrderStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end);

    @EntityGraph(attributePaths = "items")
    List<Order> findByOrderStatusInAndCreatedAtBetween(List<OrderStatus> statuses, Instant start, Instant end);

}
