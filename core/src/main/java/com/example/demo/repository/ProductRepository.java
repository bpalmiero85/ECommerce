package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  List<Product> findByCategoryIgnoreCaseAndProductArchivedFalseOrderByNameAsc(String category);

  List<Product> findByFeaturedTrueAndProductArchivedFalseOrderByNameAsc();

  List<Product> findByNewArrivalTrueAndProductArchivedFalseOrderByNameAsc();

  List<Product> findBySoldOutTrueAndProductArchivedFalseOrderByNameAsc();

  List<Product> findByQuantityAndSoldOutIsFalseAndProductArchivedFalseOrderByNameAsc(Integer quantity);

  List<Product> findByCategoryIgnoreCaseAndNewArrivalTrueAndProductArchivedFalseOrderByNameAsc(String category);

  List<Product> findByCategoryIgnoreCaseAndFeaturedTrueAndProductArchivedFalseOrderByNameAsc(String category);

  List<Product> findByProductArchivedFalseOrderByIdDesc();

  List<Product> findByProductArchivedTrueOrderByIdDesc();

  @Query("select distinct p.category from Product p where p.productArchived = false order by p.category asc")
  List<String> findAllDistinctCategories();

}
