package com.example.demo.repository;

import java.util.List;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  List<Product> findByCategoryIgnoreCaseOrderByNameAsc(String category);
  List<Product> findByFeaturedTrueOrderByNameAsc();
  List<Product> findByCategoryIgnoreCaseAndFeaturedTrueOrderByNameAsc(String category);

  @Query("select distinct p.category from Product p order by p.category asc")
  List<String> findAllDistinctCategories();


 

}
