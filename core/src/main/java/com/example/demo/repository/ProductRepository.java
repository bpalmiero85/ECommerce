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

  @Query("""
  SELECT p FROM Product p
  WHERE LOWER(TRIM(p.category)) = LOWER(TRIM(:category))
  AND p.productArchived = false
  ORDER BY p.name ASC
""")
List<Product> findActiveByCategory(@org.springframework.data.repository.query.Param("category") String category);

List<Product> findByQuantityAndSoldOutFalseAndProductArchivedFalseOrderByNameAsc(Integer quantity);

  List<Product> findByCategoryIgnoreCaseAndNewArrivalTrueAndProductArchivedFalseOrderByNameAsc(String category);

  List<Product> findByCategoryIgnoreCaseAndFeaturedTrueAndProductArchivedFalseOrderByNameAsc(String category);

  List<Product> findByProductArchivedFalseOrderByIdDesc();

  List<Product> findByProductArchivedTrueOrderByIdDesc();

  @Query("select distinct p.category from Product p where p.productArchived = false order by p.category asc")
  List<String> findAllDistinctCategories();

}
